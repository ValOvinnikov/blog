/**
 * Storybook-only stand-in for `@blog/utils`'s encryption module, which
 * imports `node:crypto` at module scope. Vite's browser-external stub for
 * that module throws the instant `createCipheriv`/`createDecipheriv`/
 * `randomBytes` are destructured off it, so merely importing the real file
 * — pulled in transitively via `@blog/utils`'s root barrel, which
 * `apps/web/src/i18n/request.ts` imports for `deepMergePartial` — crashes
 * every story (`.storybook/main.ts` aliases the exact specifier to this
 * module). No story calls either export.
 */
export const encryptSecret = (): string => {
  throw new Error('encryptSecret is not available in Storybook.');
};

export const decryptSecret = (): string => {
  throw new Error('decryptSecret is not available in Storybook.');
};
