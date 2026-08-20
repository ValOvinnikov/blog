/**
 * Real `@blog/db` constants for spreading into a `vi.mock('@blog/db', …)`
 * factory. Sourced from the constants-only submodule (never the root
 * barrel), so the mock never eagerly loads the Neon/Drizzle client or
 * validates `DATABASE_URL`.
 */
export const mockDbConstants = async () => {
  return await import('@blog/db/constants');
};
