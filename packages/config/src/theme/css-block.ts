import { COLOR_SCHEME, type TColorScheme } from '@shinefold/config/constants';

export const PAGE_SCHEME_SELECTORS: Record<TColorScheme, string> = {
  [COLOR_SCHEME.LIGHT]: ':root',
  [COLOR_SCHEME.DARK]: '.dark',
};

export const skinSelector = (key: string): string => `[data-skin='${key}']`;

export const skinSchemeSelector = (
  key: string,
  scheme: TColorScheme,
): string =>
  scheme === COLOR_SCHEME.DARK
    ? `${PAGE_SCHEME_SELECTORS[COLOR_SCHEME.DARK]} ${skinSelector(key)}`
    : skinSelector(key);

export const formatBlock = (
  selector: string,
  declarations: string[],
): string[] => [
  `${selector} {`,
  ...declarations.map((declaration) => `  ${declaration};`),
  '}',
  '',
];
