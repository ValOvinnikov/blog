import { readFileSync } from 'node:fs';

import type { TThemeDeclarations } from '@shinefold/config/theme';

export const readRepoFile = (path: string): string =>
  readFileSync(new URL(`../../../../${path}`, import.meta.url), 'utf8');

export const readCssBlock = (css: string, selector: string): string => {
  const flattened = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

  return flattened.split(` ${selector} { `)[1]?.split(' }')[0] ?? '';
};

export const readThemeDeclarations = (
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
