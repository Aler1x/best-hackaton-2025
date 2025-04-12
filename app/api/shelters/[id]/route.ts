import { NextRequest, NextResponse } from 'next/server';
import { createDrizzleClient } from '@/lib/db';
import { shelters } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/shelters/[id] - Get a single shelter by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing shelter ID' }, { status: 400 });
    }
    
    // Get database client
    const db = await createDrizzleClient();
    
    // Get shelter by ID
    const result = await db.select().from(shelters).where(eq(shelters.id, id)).limit(1);
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Shelter not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching shelter:', error);
    return NextResponse.json({ error: 'Failed to fetch shelter' }, { status: 500 });
  }
} 