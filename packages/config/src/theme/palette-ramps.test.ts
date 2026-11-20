import { PRESET_ID, PRESET_REGISTRY } from '@shinefold/config/constants';
import {
  readCssBlock,
  readRepoFile,
} from '@shinefold/config/testing/theme-css';

import { BRAND_PALETTE, formatPaletteDeclarations } from './palette-ramps';

const CONSOLE_HUE = PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue;

const MOCK_TENANT_HUE = 28;

const readColours = (css: string, selector: string): string[] =>
  [
    ...readCssBlock(css, selector).matchAll(
      /\b(?:oklch|oklab|lch|lab|rgba?|hsla?|hwb|color)\(([^)]*)\)|#[\da-f]{3,8}\b/gi,
    ),
  ].map(([colour]) => colour);

const toOpaqueOklch = (colour: string): string =>
  colour.replace(/\s*\/[^)]*\)$/, ')').replace(/\(\s*(.*?)\s*\)/, '($1)');

describe('the palette', () => {
  const themeCss = readRepoFile('configs/tailwind/theme.css');
  const stops = Object.values(formatPaletteDeclarations(CONSOLE_HUE));

  it.each([':root', '.dark'])(
    'holds every colour theme.css sets in %s as a stop',
    (selector) => {
      const colours = readColours(themeCss, selector);

      expect(colours.length).toBeGreaterThan(0);

      for (const colour of colours) {
        expect(stops).toContain(toOpaqueOklch(colour));
      }
    },
  );
});

describe(formatPaletteDeclarations, () => {
  it('puts every brand stop at the tenant hue', () => {
    const declarations = formatPaletteDeclarations(MOCK_TENANT_HUE);

    for (const property of Object.keys(BRAND_PALETTE)) {
      expect(declarations[property as keyof typeof declarations]).toMatch(
        new RegExp(` ${MOCK_TENANT_HUE}\\)$`),
      );
    }
  });
});
