import { NextRequest, NextResponse } from 'next/server';
import { createDrizzleClient } from '@/lib/db';
import { pets, petTypeEnum, petStatusEnum } from '@/db/schema';
import { eq, and, like, inArray } from 'drizzle-orm';
import { createClient } from '@/utils/supabase/server';

// GET /api/pets - Get all pets with optional filtering
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const name = searchParams.get('name');
    const shelter = searchParams.get('shelter');
    const health = searchParams.get('health');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get database client
    const db = await createDrizzleClient();
    
    // Initialize query
    let query = db.select().from(pets);
    
    // Apply filters
    if (type) {
      const types = type.split(',');
      if (types.length > 0 && types.every(t => Object.values(petTypeEnum.enumValues).includes(t as any))) {
        query = query.where(inArray(pets.type, types as any[]));
      }
    }
    
    if (status) {
      const statuses = status.split(',');
      if (statuses.length > 0 && statuses.every(s => Object.values(petStatusEnum.enumValues).includes(s as any))) {
        query = query.where(inArray(pets.status, statuses as any[]));
      }
    }
    
    if (name) {
      query = query.where(like(pets.name, `%${name}%`));
    }
    
    if (shelter) {
      query = query.where(eq(pets.shelter_id, shelter));
    }
    
    if (health) {
      query = query.where(like(pets.health, `%${health}%`));
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Execute query
    const result = await query;
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching pets:', error);
    return NextResponse.json({ error: 'Failed to fetch pets' }, { status: 500 });
  }
}

// POST /api/pets - Create a new pet
export async function POST(req: NextRequest) {
  try {
    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the user is a shelter
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!userData || userData.role !== 'shelter') {
      return NextResponse.json({ error: 'Only shelters can create pets' }, { status: 403 });
    }
    
    // Get shelter ID
    const { data: shelterData } = await supabase
      .from('shelters')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (!shelterData) {
      return NextResponse.json({ error: 'Shelter not found' }, { status: 404 });
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Validate required fields
    const { name, sex, age, type } = body;
    if (!name || !sex || !age || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate pet type
    if (!Object.values(petTypeEnum.enumValues).includes(type)) {
      return NextResponse.json({ error: 'Invalid pet type' }, { status: 400 });
    }
    
    // Validate images array if provided
    if (body.images && !Array.isArray(body.images)) {
      return NextResponse.json({ error: 'Images must be an array of URLs' }, { status: 400 });
    }
    
    // Insert the pet
    const db = await createDrizzleClient();
    const petData = {
      ...body,
      shelter_id: shelterData.id,
      images: Array.isArray(body.images) ? body.images : [],
    };
    
    const newPet = await db.insert(pets).values(petData).returning();
    
    return NextResponse.json(newPet[0], { status: 201 });
  } catch (error) {
    console.error('Error creating pet:', error);
    return NextResponse.json({ error: 'Failed to create pet' }, { status: 500 });
  }
}

// DELETE /api/pets - Delete a pet by ID (only available to the shelter that created it)
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = parseInt(searchParams.get('id') || '0');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing pet ID' }, { status: 400 });
    }
    
    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the pet to check ownership
    const db = await createDrizzleClient();
    const pet = await db.select().from(pets).where(eq(pets.id, id)).limit(1);
    
    if (pet.length === 0) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }
    
    // Check if the user is the owner of the pet
    if (pet[0].shelter_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own pets' }, { status: 403 });
    }
    
    // Get the image URLs to clean up from storage
    const imageUrls = pet[0].images as string[] || [];
    
    // Delete the pet from database
    await db.delete(pets).where(eq(pets.id, id));
    
    // Clean up images from storage
    if (imageUrls.length > 0) {
      // Extract file paths from the URLs
      const filesToDelete = imageUrls.map(url => {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        // Remove the bucket path prefix (typically /storage/v1/object/public/images/)
        return path.split('/images/')[1];
      }).filter(Boolean);
      
      if (filesToDelete.length > 0) {
        // Delete the files from Supabase storage
        await supabase.storage.from('images').remove(filesToDelete);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pet:', error);
    return NextResponse.json({ error: 'Failed to delete pet' }, { status: 500 });
  }
} 