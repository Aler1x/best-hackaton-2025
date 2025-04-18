import { NextRequest, NextResponse } from 'next/server';
import { createDrizzleClient } from '@/lib/db';
import { foundPets, petTypeEnum, petAlerts } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/utils/supabase/server';

// GET /api/found-pets - Get all found pets
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Get database client
    const db = await createDrizzleClient();
    
    // Build query with SQL template
    let query = sql`SELECT * FROM found_pets`;
    
    // Apply filters (this is a simplified approach)
    let whereConditions = [];
    
    if (type && Object.values(petTypeEnum.enumValues).includes(type as any)) {
      whereConditions.push(sql`type = ${type}`);
    }
    
    if (status) {
      whereConditions.push(sql`status = ${status}`);
    }
    
    if (whereConditions.length > 0) {
      query = sql`${query} WHERE ${sql.join(whereConditions, sql` AND `)}`;
    }
    
    // Apply pagination
    query = sql`${query} LIMIT ${limit} OFFSET ${offset}`;
    
    // Execute query
    const result = await db.execute(query);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching found pets:', error);
    return NextResponse.json({ error: 'Failed to fetch found pets' }, { status: 500 });
  }
}

// POST /api/found-pets - Report a found pet
export async function POST(req: NextRequest) {
  try {
    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the user is a volunteer
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!userData || userData.role !== 'volunteer') {
      return NextResponse.json({ error: 'Only volunteers can report found pets' }, { status: 403 });
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Validate required fields
    const { type, description, location, images } = body;
    if (!type || !description || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate pet type
    if (!Object.values(petTypeEnum.enumValues).includes(type)) {
      return NextResponse.json({ error: 'Invalid pet type' }, { status: 400 });
    }
    
    // Validate location
    if (!location.lat || !location.lng) {
      return NextResponse.json({ error: 'Invalid location format' }, { status: 400 });
    }
    
    // Get database client
    const db = await createDrizzleClient();
    
    // Create the found pet report
    const newFoundPet = await db.insert(foundPets).values({
      volunteer_id: user.id,
      type,
      description,
      location,
      status: 'reported',
      images: images || [],
    }).returning();
    
    // Find matching alerts (using raw SQL to avoid type issues)
    const matchingAlertsQuery = sql`SELECT * FROM pet_alerts WHERE pet_type = ${type}`;
    const matchingAlerts = await db.execute(matchingAlertsQuery);
    
    // In a production app, we would also:
    // 1. Check if the alert location is within the radius of the found pet
    // 2. Send notifications to volunteers with matching alerts
    
    return NextResponse.json({
      foundPet: newFoundPet[0],
      matchingAlerts: matchingAlerts.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Error reporting found pet:', error);
    return NextResponse.json({ error: 'Failed to report found pet' }, { status: 500 });
  }
}

// PATCH /api/found-pets - Update a found pet report status
export async function PATCH(req: NextRequest) {
  try {
    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Validate required fields
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate status
    if (!['reported', 'processed', 'rescued'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    
    // Get database client
    const db = await createDrizzleClient();
    
    // Get the found pet to check ownership (using raw SQL)
    const findPetQuery = sql`SELECT * FROM found_pets WHERE id = ${id} LIMIT 1`;
    const foundPet = await db.execute(findPetQuery);
    
    if (foundPet.length === 0) {
      return NextResponse.json({ error: 'Found pet report not found' }, { status: 404 });
    }
    
    // Check if the user is the owner of the report
    if (foundPet[0].volunteer_id !== user.id) {
      return NextResponse.json({ error: 'You can only update your own reports' }, { status: 403 });
    }
    
    // Update the found pet status
    const updatedFoundPet = await db.update(foundPets)
      .set({
        status,
        updated_at: new Date(),
      })
      .where(eq(foundPets.id, id))
      .returning();
    
    return NextResponse.json(updatedFoundPet[0]);
  } catch (error) {
    console.error('Error updating found pet status:', error);
    return NextResponse.json({ error: 'Failed to update found pet status' }, { status: 500 });
  }
} 