import { readCssBlock, readRepoFile } from '@blog/config/testing/theme-css';

import {
  DERIVED_RADIUS_DECLARATIONS,
  DERIVED_SPACING_DECLARATIONS,
  type TThemeDeclarations,
} from './theme-declarations';

const readThemeDeclarations = (
  map: TThemeDeclarations,
): Record<string, string> => {
  const block = readCssBlock(
    readRepoFile('configs/tailwind/theme.css'),
    '@theme',
  );
  const declared = Object.fromEntries(
    [...block.matchAll(/(--[\w-]+): ([^;]+);/g)].map(([, property, value]) => [
      property,
      value,
    ]),
  );

  return Object.fromEntries(
    Object.keys(map).map((property) => [property, declared[property]]),
  );
};

describe('derived theme declarations', () => {
  it('match the radius aliases theme.css derives in @theme', () => {
    expect(readThemeDeclarations(DERIVED_RADIUS_DECLARATIONS)).toEqual(
      DERIVED_RADIUS_DECLARATIONS,
    );
  });

  it('match the band spacing steps theme.css derives in @theme', () => {
    expect(readThemeDeclarations(DERIVED_SPACING_DECLARATIONS)).toEqual(
      DERIVED_SPACING_DECLARATIONS,
    );
  });
});
