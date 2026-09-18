import { migrate } from "drizzle-orm/node-postgres/migrator";
import { connect } from "@iq/db";

export default async function setup() {
  const db = connect("postgres://postgres:postgres@localhost:5432/industryquest_test");
  await migrate(db, { migrationsFolder: new URL("../../../packages/db/migrations", import.meta.url).pathname });
  await db.pool.end();
}
