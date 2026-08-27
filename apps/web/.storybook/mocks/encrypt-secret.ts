/**
 * Storybook-only stand-in for `@blog/utils`'s encryption module, which
 * imports `node:crypto` at module scope. Vite's browser-external stub for
 * that module throws the instant `createCipheriv`/`createDecipheriv`/
 * `randomBytes` are destructured off it, so merely importing the real file
 * — pulled in transitively via `@blog/utils`'s root barrel, which
 * `apps/web/src/i18n/request.ts` imports for `deepMergePartial` — crashes
 * every story (`.storybook/main.ts`'s `resolveId` plugin redirects that one
 * importer to this module). No story calls either export.
 */
export const encryptSecret = (plaintext: string, keyBase64: string): string => {
  void plaintext;
  void keyBase64;
  throw new Error('encryptSecret is not available in Storybook.');
};

export const decryptSecret = (encrypted: string, keyBase64: string): string => {
  void encrypted;
  void keyBase64;
  throw new Error('decryptSecret is not available in Storybook.');
};
