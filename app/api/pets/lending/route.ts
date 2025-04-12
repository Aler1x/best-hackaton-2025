import { NextRequest, NextResponse } from 'next/server';
import { createDrizzleClient } from '@/lib/db';
import { pets, petStatusEnum } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// GET /api/pets/lending - Get random pets for lending (up to 3)
export async function GET(req: NextRequest) {
  try {
    const limit = 3; // Number of pets to return

    // Get database client
    const db = await createDrizzleClient();
    
    // Get random pets that are in_shelter status
    // Using SQL's random() function to get random results
    const result = await db.select()
      .from(pets)
      .orderBy(sql`RANDOM()`)
      .limit(limit);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching lending pets:', error);
    return NextResponse.json({ error: 'Failed to fetch lending pets' }, { status: 500 });
  }
} 