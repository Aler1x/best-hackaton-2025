import { NextRequest, NextResponse } from 'next/server';
import { createDrizzleClient } from '@/lib/db';
import { favorites, pets, volunteers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/utils/supabase/server';

// GET /api/favorites - Get all favorites for the current user
export async function GET(req: NextRequest) {
  try {
    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get volunteer ID
    const { data: volunteerData } = await supabase
      .from('volunteers')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (!volunteerData) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 });
    }
    
    // Get database client
    const db = await createDrizzleClient();
    
    // Get all favorites with pet information
    const result = await db.select({
      favorite: favorites,
      pet: pets,
    })
    .from(favorites)
    .leftJoin(pets, eq(favorites.petId, pets.id))
    .where(eq(favorites.volunteerId, user.id));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST /api/favorites - Add a pet to favorites
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
      return NextResponse.json({ error: 'Only volunteers can add favorites' }, { status: 403 });
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Validate required fields
    const { petId } = body;
    if (!petId) {
      return NextResponse.json({ error: 'Missing pet ID' }, { status: 400 });
    }
    
    // Get database client
    const db = await createDrizzleClient();
    
    // Check if the pet exists
    const pet = await db.select().from(pets).where(eq(pets.id, petId)).limit(1);
    
    if (pet.length === 0) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }
    
    // Check if the favorite already exists
    const existingFavorite = await db.select()
      .from(favorites)
      .where(
        and(
          eq(favorites.volunteerId, user.id),
          eq(favorites.petId, petId)
        )
      )
      .limit(1);
    
    if (existingFavorite.length > 0) {
      return NextResponse.json({ error: 'Pet is already in favorites' }, { status: 409 });
    }
    
    // Add the favorite
    const newFavorite = await db.insert(favorites).values({
      volunteerId: user.id,
      petId,
    }).returning();
    
    return NextResponse.json(newFavorite[0], { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

// DELETE /api/favorites - Remove a pet from favorites
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const petId = parseInt(searchParams.get('petId') || '0');
    
    if (!petId) {
      return NextResponse.json({ error: 'Missing pet ID' }, { status: 400 });
    }
    
    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get database client
    const db = await createDrizzleClient();
    
    // Delete the favorite
    const deleted = await db.delete(favorites)
      .where(
        and(
          eq(favorites.volunteerId, user.id),
          eq(favorites.petId, petId)
        )
      )
      .returning();
    
    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
} 