// Fails the build if this module is ever pulled into a client bundle — the
// db client reads DATABASE_URL and must stay server-only.
import 'server-only';

import { env } from '@blog/db/utils/env/env';
import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

import * as schema from './schema';

type TNeonDb = NeonHttpDatabase<typeof schema>;

// The base class of both the Neon driver and the tests' PGlite one, so a query runs unmodified against either.
export type TDb = PgDatabase<PgQueryResultHKT, typeof schema>;

let dbInstance: TNeonDb | undefined;

// Migrations use the unpooled DSN through drizzle-kit, never this client.
export function getDb(): TDb {
  if (dbInstance) return dbInstance;

  const sql = neon(env.DATABASE_URL);
  dbInstance = drizzle(sql, { schema });

  return dbInstance;
}
