import { at, createIfNotExists, patch, set } from 'sanity/migrate';

import {
  indigoThemeMutations,
  INDIGO_THEME_TARGET,
  THEME_DOCUMENT_ID,
  THEME_DOCUMENT_TYPE,
} from './transform';

const INDIGO_SITE = { brand: { variant: 'INDIGO' } };

const THEME_PATCH = patch(THEME_DOCUMENT_ID, [
  at('preset', set(INDIGO_THEME_TARGET.preset)),
  at('accentHue', set(INDIGO_THEME_TARGET.accentHue)),
  at('logoHue', set(INDIGO_THEME_TARGET.logoHue)),
]);

describe(indigoThemeMutations, () => {
  it('creates and patches the theme for an INDIGO site', () => {
    const result = indigoThemeMutations(INDIGO_SITE, undefined);

    expect(result).toEqual([
      createIfNotExists({
        _id: THEME_DOCUMENT_ID,
        _type: THEME_DOCUMENT_TYPE,
        ...INDIGO_THEME_TARGET,
      }),
      THEME_PATCH,
    ]);
  });

  it('converges an existing theme with different values to the target', () => {
    const result = indigoThemeMutations(INDIGO_SITE, {
      preset: 'EDITORIAL',
      accentHue: 28,
      logoHue: 28,
    });

    expect(result?.at(-1)).toEqual(THEME_PATCH);
  });

  it.each([
    ['a CONSOLE site', { brand: { variant: 'CONSOLE' } }],
    ['a site without a brand variant', { brand: {} }],
  ])('returns undefined for %s', (_label, site) => {
    const result = indigoThemeMutations(site, undefined);

    expect(result).toBeUndefined();
  });

  it('leaves a theme that already matches the target alone', () => {
    const result = indigoThemeMutations(INDIGO_SITE, {
      ...INDIGO_THEME_TARGET,
    });

    expect(result).toBeUndefined();
  });
});
