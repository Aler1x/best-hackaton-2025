import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { createClient } from '@/utils/supabase/server';

// For server-side API routes and migrations
export const createDrizzleClient = async () => {
  // Get the Supabase connection string from the Supabase client
  // This is a secure way to get the connection string without exposing it
  const supabase = await createClient();
  const { data: { database_url } } = await supabase.rpc('get_service_role_connection');

  if (!database_url) {
    throw new Error('Database connection string not found');
  }

  // Create postgres connection
  const client = postgres(database_url);
  
  // Create drizzle client
  return drizzle(client);
};

// Run migrations (for local development and CI/CD pipelines)
export const runMigrations = async () => {
  const db = await createDrizzleClient();
  await migrate(db, { migrationsFolder: 'drizzle' });
  return db;
};

// Export the schema
export * from './schema'; 