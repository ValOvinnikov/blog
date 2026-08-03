// Public surface of the relational data layer. web imports `@blog/db` —
// never a raw Drizzle/Neon client import path.
export { getDb } from './client';
export * as schema from './schema';
