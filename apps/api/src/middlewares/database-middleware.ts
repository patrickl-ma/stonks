import { drizzle } from "drizzle-orm/node-postgres";
import { createMiddleware } from "hono/factory";
import { Client } from "pg";
import * as schema from "@stonks/db/schema";
import type { ApiEnv } from "../lib/api-env";

export async function createDb(connectionString: string) {
  const client = new Client({ connectionString });
  await client.connect();

  return drizzle({ client, schema });
}
// normally we shouldn't create a new db client per connection, 
// but since we're using cloudflare hyperdrive, this is actually what's recommended.
export const databaseMiddleware = createMiddleware<ApiEnv>(async (c, next) => {
  c.set("db", await createDb(c.env.HYPERDRIVE.connectionString));
  await next();
});
