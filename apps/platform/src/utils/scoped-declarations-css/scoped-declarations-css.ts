import type { TThemeDeclarations } from '@shinefold/config';

export const toScopedDeclarationsCss = (
  selector: string,
  declarations: TThemeDeclarations,
): string => {
  const body = Object.entries(declarations)
    .map(([property, value]) => `${property}: ${value};`)
    .join(' ');

  return `${selector} { ${body} }`;
};
