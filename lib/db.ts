import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '../db/schema';
import postgres from 'postgres';

// Get the database client
export async function createDrizzleClient() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set');
    }
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client);
    return db;
}