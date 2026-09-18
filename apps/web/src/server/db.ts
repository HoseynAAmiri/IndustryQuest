import "server-only";
import { after } from "next/server";
import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { connect } from "@iq/db";

// One client per request. Hyperdrive does the pooling on Cloudflare; locally the binding
// points at the Docker Postgres through localConnectionString in wrangler.jsonc.
// Close it once the response is done, or a long-running dev server leaks connections until
// Postgres refuses new ones.
export const getDb = cache(() => {
  const db = connect(getCloudflareContext().env.HYPERDRIVE.connectionString);
  after(() => db.pool.end());
  return db;
});
