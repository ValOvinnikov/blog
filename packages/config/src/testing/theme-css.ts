import { readFileSync } from 'node:fs';

import type { TThemeDeclarations } from '@shinefold/config/theme';
import type { TMaybeUndefined } from '@shinefold/config/types';

export const readRepoFile = (path: string): string =>
  readFileSync(new URL(`../../../../${path}`, import.meta.url), 'utf8');

export const readThemeCss = (): string =>
  readRepoFile('configs/tailwind/theme.css');

export const readCssDeclarations = (block: string): Record<string, string> =>
  Object.fromEntries(
    [...block.matchAll(/(--[\w-]+): ([^;]+);/g)].map(([, property, value]) => [
      property,
      value,
    ]),
  );

export const readCssBlock = (css: string, selector: string): string => {
  const flattened = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

  return flattened.split(` ${selector} { `)[1]?.split(' }')[0] ?? '';
};

export const readThemeDeclarations = (
  map: TThemeDeclarations,
): Record<string, TMaybeUndefined<string>> => {
  const declared = readCssDeclarations(readCssBlock(readThemeCss(), '@theme'));

  return Object.fromEntries(
    Object.keys(map).map((property) => [property, declared[property]]),
  );
};
