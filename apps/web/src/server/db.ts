import "server-only";
import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { connect } from "@iq/db";

// One client per request. Hyperdrive does the pooling on Cloudflare; locally the binding
// points at the Docker Postgres through localConnectionString in wrangler.jsonc.
export const getDb = cache(() => connect(getCloudflareContext().env.HYPERDRIVE.connectionString));
