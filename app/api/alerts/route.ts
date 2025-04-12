import { NextRequest, NextResponse } from 'next/server';
import { createDrizzleClient } from '@/lib/db';
import { petAlerts, petTypeEnum } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/utils/supabase/server';

// GET /api/alerts - Get all alerts for the current user
export async function GET(req: NextRequest) {
  try {
    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get database client
    const db = await createDrizzleClient();
    
    // Get all alerts for the current user
    const alerts = await db.select()
      .from(petAlerts)
      .where(eq(petAlerts.volunteer_id, user.id));
    
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

// POST /api/alerts - Create a new alert
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
      return NextResponse.json({ error: 'Only volunteers can create alerts' }, { status: 403 });
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Validate required fields
    const { petType, location } = body;
    if (!petType || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate pet type
    if (!Object.values(petTypeEnum.enumValues).includes(petType)) {
      return NextResponse.json({ error: 'Invalid pet type' }, { status: 400 });
    }
    
    // Validate location
    if (!location.lat || !location.lng || !location.radius) {
      return NextResponse.json({ error: 'Invalid location format' }, { status: 400 });
    }
    
    // Get database client
    const db = await createDrizzleClient();
    
    // Create the alert
    const newAlert = await db.insert(petAlerts).values({
      volunteer_id: user.id,
      petType,
      location,
      active: true,
    }).returning();
    
    return NextResponse.json(newAlert[0], { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
}

// DELETE /api/alerts - Delete an alert
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = parseInt(searchParams.get('id') || '0');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing alert ID' }, { status: 400 });
    }
    
    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get database client
    const db = await createDrizzleClient();
    
    // Get the alert to check ownership
    const alert = await db.select()
      .from(petAlerts)
      .where(eq(petAlerts.id, id))
      .limit(1);
    
    if (alert.length === 0) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }
    
    // Check if the user is the owner of the alert
    if (alert[0].volunteer_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own alerts' }, { status: 403 });
    }
    
    // Delete the alert
    await db.delete(petAlerts).where(eq(petAlerts.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
  }
} 