import { NextRequest, NextResponse } from 'next/server';
import { createDrizzleClient } from '@/lib/db';
import { pets, shelters } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/utils/supabase/server';

// GET /api/pets/[id] - Get a pet by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid pet ID' }, { status: 400 });
    }
    
    // Get database client
    const db = await createDrizzleClient();
    
    // Get the pet with shelter information
    const result = await db.select({
      pet: pets,
      shelter: {
        id: shelters.id,
        name: shelters.name,
        address: shelters.address,
        phone: shelters.phone,
        website: shelters.website,
        donation_link: shelters.donation_link,
      }
    })
    .from(pets)
    .leftJoin(shelters, eq(pets.shelter_id, shelters.id))
    .where(eq(pets.id, id))
    .limit(1);
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching pet:', error);
    return NextResponse.json({ error: 'Failed to fetch pet' }, { status: 500 });
  }
}

// PATCH /api/pets/[id] - Update a pet by ID
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid pet ID' }, { status: 400 });
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
      return NextResponse.json({ error: 'You can only update your own pets' }, { status: 403 });
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Don't allow changing the shelter ID
    delete body.shelter_id;
    
    // Validate images array if provided
    if (body.images !== undefined) {
      if (!Array.isArray(body.images)) {
        return NextResponse.json({ error: 'Images must be an array of URLs' }, { status: 400 });
      }
      
      // Ensure all items in the array are strings
      if (body.images.some((url: string) => typeof url !== 'string')) {
        return NextResponse.json({ error: 'All image URLs must be strings' }, { status: 400 });
      }
    }
    
    // Update the pet
    const updatedPet = await db.update(pets)
      .set({
        ...body,
        updated_at: new Date(),
      })
      .where(eq(pets.id, id))
      .returning();
    
    return NextResponse.json(updatedPet[0]);
  } catch (error) {
    console.error('Error updating pet:', error);
    return NextResponse.json({ error: 'Failed to update pet' }, { status: 500 });
  }
} 