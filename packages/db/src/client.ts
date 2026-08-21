import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

export const createDatabase = (databaseUrl: string) => {
  const databaseClient = postgres(databaseUrl)
  const db = drizzle(databaseClient, { schema })

  return {
    databaseClient,
    db,
    close: () => databaseClient.end(),
  }
}

export type Database = ReturnType<typeof createDatabase>
