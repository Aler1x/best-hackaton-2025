import { NextRequest, NextResponse } from 'next/server';
import { createDrizzleClient } from '@/lib/db';
import { shelters } from '@/db/schema';
import { like } from 'drizzle-orm';
import { createClient } from '@/utils/supabase/server';

// GET /api/shelters - Get all shelters with optional filtering
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const name = searchParams.get('name');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get database client
    const db = await createDrizzleClient();
    
    // Initialize query
    let query = db.select().from(shelters);
    
    // Apply name filter if provided
    if (name) {
      query = query.where(like(shelters.name, `%${name}%`));
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Execute query
    const result = await query;
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching shelters:', error);
    return NextResponse.json({ error: 'Failed to fetch shelters' }, { status: 500 });
  }
} 