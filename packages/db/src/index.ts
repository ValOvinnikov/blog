// Public surface of the relational data layer. web imports `@blog/db` —
// never a raw Drizzle/Neon client import path.
export { getDb } from './client';
export * from './constants';
export * as queries from './queries';
export * as schema from './schema';
