import { NextRequest, NextResponse } from 'next/server';
import { createDrizzleClient } from '@/lib/db';
import { favorites } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/utils/supabase/server';

// GET /api/favorites/check?petId=1
export async function GET(req: NextRequest) {
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
      return NextResponse.json({ isFavorite: false });
    }
    
    // Get database client
    const db = await createDrizzleClient();
    
    // Check if the favorite exists
    const existingFavorite = await db.select()
      .from(favorites)
      .where(
        and(
          eq(favorites.volunteerId, user.id),
          eq(favorites.petId, petId)
        )
      )
      .limit(1);
    
    return NextResponse.json({ isFavorite: existingFavorite.length > 0 });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return NextResponse.json({ error: 'Failed to check favorite status' }, { status: 500 });
  }
} 