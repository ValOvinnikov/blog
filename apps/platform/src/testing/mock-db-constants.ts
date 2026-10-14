// The constants submodule, never the root barrel, so the mock never loads the Neon client or validates `DATABASE_URL`.
export const mockDbConstants = async () => {
  return await import('@blog/db/constants');
};
