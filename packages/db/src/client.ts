// Fails the build if this module is ever pulled into a client bundle — the
// db client reads DATABASE_URL and must stay server-only.
import 'server-only';

import { env } from '@blog/db/utils/env/env';
import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';

import * as schema from './schema';

type TDb = NeonHttpDatabase<typeof schema>;

let dbInstance: TDb | undefined;

// The pooled Neon HTTP driver — the single runtime connection every db.*
// query/mutation goes through from apps/web (Server Components, Route
// Handlers). Migrations use the separate unpooled DSN via drizzle-kit
// directly (see drizzle.config.ts), never this client.
export function getDb(): TDb {
  if (dbInstance) return dbInstance;

  const sql = neon(env.DATABASE_URL);
  dbInstance = drizzle(sql, { schema });

  return dbInstance;
}
