import { NextRequest, NextResponse } from 'next/server';
import { createDrizzleClient } from '@/lib/db';
import { foundPets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { createClient } from '@/utils/supabase/server';

// GET /api/found-pets/[id] - Get a found pet by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid found pet ID' }, { status: 400 });
    }
    
    // Get database client
    const db = await createDrizzleClient();
    
    // Get the found pet record using raw SQL
    const query = sql`SELECT * FROM found_pets WHERE id = ${id} LIMIT 1`;
    const result = await db.execute(query);
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Found pet not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching found pet:', error);
    return NextResponse.json({ error: 'Failed to fetch found pet' }, { status: 500 });
  }
}

// PATCH /api/found-pets/[id] - Update a found pet
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid found pet ID' }, { status: 400 });
    }
    
    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get database client
    const db = await createDrizzleClient();
    
    // Get the found pet to check ownership using raw SQL
    const findPetQuery = sql`SELECT * FROM found_pets WHERE id = ${id} LIMIT 1`;
    const foundPet = await db.execute(findPetQuery);
    
    if (foundPet.length === 0) {
      return NextResponse.json({ error: 'Found pet not found' }, { status: 404 });
    }
    
    // Check if the user is the owner of the pet
    if (foundPet[0].volunteer_id !== user.id) {
      return NextResponse.json({ error: 'You can only update your own found pets' }, { status: 403 });
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Don't allow changing the volunteer ID
    delete body.volunteer_id;
    
    // Update the found pet
    const updatedFoundPet = await db.update(foundPets)
      .set({
        ...body,
        updated_at: new Date(),
      })
      .where(eq(foundPets.id, id))
      .returning();
    
    return NextResponse.json(updatedFoundPet[0]);
  } catch (error) {
    console.error('Error updating found pet:', error);
    return NextResponse.json({ error: 'Failed to update found pet' }, { status: 500 });
  }
}

// DELETE /api/found-pets/[id] - Delete a found pet
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid found pet ID' }, { status: 400 });
    }
    
    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the found pet to check ownership using raw SQL
    const db = await createDrizzleClient();
    const findPetQuery = sql`SELECT * FROM found_pets WHERE id = ${id} LIMIT 1`;
    const foundPet = await db.execute(findPetQuery);
    
    if (foundPet.length === 0) {
      return NextResponse.json({ error: 'Found pet not found' }, { status: 404 });
    }
    
    // Check if the user is the owner of the pet
    if (foundPet[0].volunteer_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own found pets' }, { status: 403 });
    }
    
    // Delete the found pet using raw SQL
    const deleteQuery = sql`DELETE FROM found_pets WHERE id = ${id}`;
    await db.execute(deleteQuery);
    
    // If there are images, they should be removed from storage as well
    // This would require accessing Supabase storage and removing the image files
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting found pet:', error);
    return NextResponse.json({ error: 'Failed to delete found pet' }, { status: 500 });
  }
}
