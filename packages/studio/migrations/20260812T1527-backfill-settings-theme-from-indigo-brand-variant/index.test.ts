import {
  at,
  createIfNotExists,
  patch,
  set,
  type MigrationContext,
} from 'sanity/migrate';

import {
  INDIGO_THEME_TARGET,
  THEME_DOCUMENT_ID,
  THEME_DOCUMENT_TYPE,
} from './transform';

import migration from './index';

/**
 * `context.client` is the live, unrestricted `@sanity/client` — unlike
 * `context.filtered`, it isn't scoped to this migration's `documentTypes`,
 * so it's the only context member that can actually resolve a
 * `settings_theme` document from a `settings_site`-typed migration run.
 */
const fakeContext = (
  currentTheme: Record<string, unknown> | undefined,
  getDocument = async () => currentTheme,
): MigrationContext =>
  ({
    client: { getDocument },
  }) as unknown as MigrationContext;

describe('settings_theme backfill document() wiring', () => {
  it('fetches the current settings_theme and forwards it to the transform', async () => {
    const result = await migration.migrate.document?.(
      // @ts-expect-error -- only the fields the transform reads are needed
      { brand: { variant: 'INDIGO' } },
      fakeContext(undefined),
    );

    expect(result).toEqual([
      createIfNotExists({
        _id: THEME_DOCUMENT_ID,
        _type: THEME_DOCUMENT_TYPE,
        ...INDIGO_THEME_TARGET,
      }),
      patch(THEME_DOCUMENT_ID, [
        at('preset', set(INDIGO_THEME_TARGET.preset)),
        at('accentHue', set(INDIGO_THEME_TARGET.accentHue)),
        at('logoHue', set(INDIGO_THEME_TARGET.logoHue)),
      ]),
    ]);
  });

  it('is a no-op for a settings_site document with brand.variant CONSOLE, without calling getDocument', async () => {
    const getDocument = vi.fn(async () => undefined);

    const result = await migration.migrate.document?.(
      // @ts-expect-error -- only the fields the transform reads are needed
      { brand: { variant: 'CONSOLE' } },
      fakeContext(undefined, getDocument),
    );

    expect(result).toEqual([]);
    expect(getDocument).not.toHaveBeenCalled();
  });

  it('skips when settings_theme already matches INDIGO_THEME_TARGET (idempotency guard)', async () => {
    const result = await migration.migrate.document?.(
      // @ts-expect-error -- only the fields the transform reads are needed
      { brand: { variant: 'INDIGO' } },
      fakeContext({
        _id: THEME_DOCUMENT_ID,
        _type: THEME_DOCUMENT_TYPE,
        ...INDIGO_THEME_TARGET,
      }),
    );

    expect(result).toEqual([]);
  });

  it('migrates when settings_theme exists but differs from INDIGO_THEME_TARGET', async () => {
    const result = await migration.migrate.document?.(
      // @ts-expect-error -- only the fields the transform reads are needed
      { brand: { variant: 'INDIGO' } },
      fakeContext({
        _id: THEME_DOCUMENT_ID,
        _type: THEME_DOCUMENT_TYPE,
        preset: INDIGO_THEME_TARGET.preset,
        accentHue: 10,
        logoHue: 20,
      }),
    );

    expect(result).toEqual([
      createIfNotExists({
        _id: THEME_DOCUMENT_ID,
        _type: THEME_DOCUMENT_TYPE,
        ...INDIGO_THEME_TARGET,
      }),
      patch(THEME_DOCUMENT_ID, [
        at('preset', set(INDIGO_THEME_TARGET.preset)),
        at('accentHue', set(INDIGO_THEME_TARGET.accentHue)),
        at('logoHue', set(INDIGO_THEME_TARGET.logoHue)),
      ]),
    ]);
  });
});
