import { readFileSync } from 'node:fs';

export const readRepoFile = (path: string): string =>
  readFileSync(new URL(`../../../../${path}`, import.meta.url), 'utf8');

export const readCssBlock = (css: string, selector: string): string => {
  const flattened = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

  return flattened.split(` ${selector} { `)[1]?.split(' }')[0] ?? '';
};
