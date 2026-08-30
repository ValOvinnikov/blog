import { at, createIfNotExists, patch, set } from 'sanity/migrate';

import {
  indigoThemeMutations,
  INDIGO_THEME_TARGET,
  THEME_DOCUMENT_ID,
  THEME_DOCUMENT_TYPE,
} from './transform';

describe(indigoThemeMutations, () => {
  it('creates/updates settings_theme for a settings_site with brand.variant INDIGO', () => {
    const result = indigoThemeMutations(
      { brand: { variant: 'INDIGO' } },
      undefined,
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

  it('converges an existing settings_theme with different values to the target', () => {
    const result = indigoThemeMutations(
      { brand: { variant: 'INDIGO' } },
      { preset: 'EDITORIAL', accentHue: 28, logoHue: 28 },
    );

    expect(result).toBeDefined();
    expect(result).toContainEqual(
      patch(THEME_DOCUMENT_ID, [
        at('preset', set(INDIGO_THEME_TARGET.preset)),
        at('accentHue', set(INDIGO_THEME_TARGET.accentHue)),
        at('logoHue', set(INDIGO_THEME_TARGET.logoHue)),
      ]),
    );
  });

  it('is a no-op for brand.variant CONSOLE', () => {
    const result = indigoThemeMutations(
      { brand: { variant: 'CONSOLE' } },
      undefined,
    );

    expect(result).toBeUndefined();
  });

  it('is a no-op when brand.variant is unset', () => {
    const result = indigoThemeMutations({ brand: {} }, undefined);

    expect(result).toBeUndefined();
  });

  it('is idempotent — settings_theme already matching the target is left alone', () => {
    const result = indigoThemeMutations(
      { brand: { variant: 'INDIGO' } },
      { ...INDIGO_THEME_TARGET },
    );

    expect(result).toBeUndefined();
  });
});
