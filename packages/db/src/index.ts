import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.ts";

export * from "./schema.ts";
export * from "./demo.ts";
export { schema };
export type Db = NodePgDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

// On Workers, create one per request: connections can't be shared across requests.
export function connect(connectionString: string) {
  const pool = new Pool({ connectionString, max: 5 });
  return Object.assign(drizzle(pool, { schema }), { pool });
}
