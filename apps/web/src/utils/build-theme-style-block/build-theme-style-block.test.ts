import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import { faker } from '@faker-js/faker';
import {
  type TThemeDeclarations,
  type TThemeTokens,
  BUTTON_SHAPE_DECLARATIONS,
  CARD_STYLE,
  CARD_STYLE_DECLARATIONS,
  DENSITY,
  DENSITY_DECLARATIONS,
  DIVIDER_WIDTH_DECLARATIONS,
  HEADER_CONTROL_SHAPE_DECLARATIONS,
  HEADER_CONTROL_STYLE_DECLARATIONS,
  HEADING_CASE_DECLARATIONS,
  HEADING_WEIGHT_DECLARATIONS,
  IMAGE_PROPORTION_DECLARATIONS,
  NAV_LINK_STYLE_DECLARATIONS,
  PRESET_ID,
  PRESET_REGISTRY,
  RADIUS_SCALE,
} from '@shinefold/config';

import { buildThemeStyleBlock } from './build-theme-style-block';

faker.seed(107);

const DARK_SELECTOR = '.dark';
const BRAND_TOKEN = '--brand-primary';
const BRAND_PALETTE_STOP = '--palette-brand-100';
const LOGO_TOKEN = '--logo-1';
const BRAND_AND_LOGO_NAMES = 'brand-primary[\\w-]*|logo-\\d';
const CONSOLE_PRESET_TOKENS = PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;
const CONSOLE_HUE = CONSOLE_PRESET_TOKENS.accentHue;
const [MOCK_ACCENT_HUE, MOCK_LOGO_HUE] = faker.helpers.uniqueArray(
  () => faker.number.int({ min: 0, max: 360 }),
  2,
);

const CONSOLE_TOKENS: TThemeTokens = {
  ...CONSOLE_PRESET_TOKENS,
  logoHue: CONSOLE_HUE,
};

const THEME_CSS_PATH = createRequire(import.meta.url).resolve(
  '@shinefold/tailwind-config/theme.css',
);
const THEME_CSS = readFileSync(THEME_CSS_PATH, 'utf8');
const SKINS_CSS = readFileSync(
  join(dirname(THEME_CSS_PATH), 'skins.css'),
  'utf8',
);
const THEME_ROOT_BLOCK = THEME_CSS.slice(
  THEME_CSS.indexOf(':root {'),
  THEME_CSS.indexOf(`${DARK_SELECTOR} {`),
);
const THEME_DARK_START = THEME_CSS.indexOf(`${DARK_SELECTOR} {`);
const THEME_DARK_BLOCK = THEME_CSS.slice(
  THEME_DARK_START,
  THEME_CSS.indexOf('\n}\n', THEME_DARK_START),
);

const RADIUS_TOKENS = [
  '--radius-sm',
  '--radius',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
];

const SPACING_TOKENS = [
  '--spacing-gutter',
  '--spacing-section',
  '--spacing-page-y',
  '--spacing-site-x',
  '--spacing-site-y',
  '--spacing-card-x',
  '--spacing-card-y',
  '--spacing-card-gap',
  '--spacing-band',
] as const;

const DARK_EXCLUDED_PREFIXES = [
  '--radius',
  '--spacing-',
  '--item-',
  '--header-control-',
  '--nav-link-',
  '--scrim-',
  '--on-image',
  '--font-weight-heading',
  '--heading-case',
  '--text-',
  '--aspect-',
  '--divider-width',
];

const splitModes = (css: string) => ({
  root: css.slice(0, css.indexOf(DARK_SELECTOR)),
  dark: css.slice(css.indexOf(DARK_SELECTOR)),
});

const STYLE_AXES: {
  field: keyof TThemeTokens;
  declarations: Record<string, TThemeDeclarations>;
}[] = [
  {
    field: 'cardStyle',
    declarations: CARD_STYLE_DECLARATIONS,
  },
  {
    field: 'headerControlStyle',
    declarations: HEADER_CONTROL_STYLE_DECLARATIONS,
  },
  {
    field: 'headerControlShape',
    declarations: HEADER_CONTROL_SHAPE_DECLARATIONS,
  },
  {
    field: 'buttonShape',
    declarations: BUTTON_SHAPE_DECLARATIONS,
  },
  {
    field: 'navLinkStyle',
    declarations: NAV_LINK_STYLE_DECLARATIONS,
  },
  {
    field: 'headingWeight',
    declarations: HEADING_WEIGHT_DECLARATIONS,
  },
  {
    field: 'headingCase',
    declarations: HEADING_CASE_DECLARATIONS,
  },
  {
    field: 'imageProportion',
    declarations: IMAGE_PROPORTION_DECLARATIONS,
  },
  {
    field: 'dividerWidth',
    declarations: DIVIDER_WIDTH_DECLARATIONS,
  },
];

const STYLE_VALUES = STYLE_AXES.flatMap(({ field, declarations }) =>
  Object.entries(declarations).map(([value, valueDeclarations]) => ({
    field,
    value,
    declarations: valueDeclarations,
  })),
);

const missingDeclarations = (
  css: string,
  declarations: TThemeDeclarations,
): string[] =>
  Object.entries(declarations)
    .map(([property, value]) => `${property}: ${value};`)
    .filter((declaration) => !css.includes(declaration));

const readPixels = (css: string, token: string): number =>
  Number(css.match(new RegExp(`${token}: (\\d+)px;`))?.[1]);

const readHue = (css: string, token: string): number =>
  Number(
    css.match(new RegExp(`${token}: oklch\\([\\d.]+ [\\d.]+ (\\d+)`))?.[1],
  );

const declarationsMatching = (source: string, names: string): string[] =>
  source.match(new RegExp(`--(${names}): (?!var\\()[^;]+;`, 'g')) ?? [];

const declarationsMatchingAny = (source: string, names: string): string[] =>
  source.match(new RegExp(`--(${names}): [^;]+;`, 'g')) ?? [];

describe(buildThemeStyleBlock, () => {
  describe('with the Console tokens', () => {
    let css: string;

    beforeEach(() => {
      css = buildThemeStyleBlock(CONSOLE_TOKENS);
    });

    it('renders :root before .dark', () => {
      expect(css.indexOf(':root')).toBeLessThan(css.indexOf(DARK_SELECTOR));
    });

    it('leaves the neutral scrim to the static theme', () => {
      expect(css).not.toContain('--scrim-neutral');
    });

    it('leaves the fixed-hue palette stops to skins.css', () => {
      expect(css).not.toMatch(/--palette-(?!brand-)/);
    });
  });

  describe('against the static theme.css and skins.css defaults', () => {
    it.each([
      {
        group: 'brand and logo colours in :root',
        source: THEME_ROOT_BLOCK,
        names: BRAND_AND_LOGO_NAMES,
        scope: 'root' as const,
      },
      {
        group: 'brand and logo colours in .dark',
        source: THEME_DARK_BLOCK,
        names: BRAND_AND_LOGO_NAMES,
        scope: 'dark' as const,
      },
      {
        group: 'brand palette stops in skins.css',
        source: SKINS_CSS,
        names: 'palette-brand-\\d+',
        scope: 'root' as const,
      },
      {
        group: 'on-image and brand scrim tokens',
        source: THEME_ROOT_BLOCK,
        names: 'on-image[\\w-]*|scrim-brand-[\\w-]+',
        scope: 'root' as const,
      },
      {
        group: 'item-card tokens',
        source: THEME_ROOT_BLOCK,
        names: 'item-[\\w-]+',
        scope: 'root' as const,
      },
      {
        group: 'header control tokens',
        source: THEME_ROOT_BLOCK,
        names: 'header-control-[\\w-]+',
        scope: 'root' as const,
      },
      {
        group: 'navigation link tokens',
        source: THEME_ROOT_BLOCK,
        names: 'nav-link-[\\w-]+',
        scope: 'root' as const,
      },
    ])('reproduces the $group', ({ source, names, scope }) => {
      const staticDeclarations = declarationsMatchingAny(source, names);
      const css = splitModes(buildThemeStyleBlock(CONSOLE_TOKENS))[scope];

      const missing = staticDeclarations.filter(
        (declaration) => !css.includes(declaration),
      );

      expect(staticDeclarations.length).toBeGreaterThan(0);
      expect(missing).toEqual([]);
    });

    it.each([
      {
        group: 'radius and layout spacing tokens',
        names:
          'radius[\\w-]*|spacing-(?:gutter|section|page-y|site-x|site-y|card-x|card-y|card-gap|band)',
        declarationCount: 14,
      },
      {
        group: 'heading, image proportion and divider tokens',
        names:
          'font-weight-heading|heading-case|aspect-(?:card|split)|divider-width|text-(?:hero|post-title|title-2xl|title-section)--letter-spacing',
        declarationCount: 9,
      },
    ])(
      'reproduces all $declarationCount $group',
      ({ names, declarationCount }) => {
        const staticDeclarations = declarationsMatching(THEME_CSS, names);
        const { root } = splitModes(buildThemeStyleBlock(CONSOLE_TOKENS));

        const missing = staticDeclarations.filter(
          (declaration) => !root.includes(declaration),
        );

        expect(staticDeclarations).toHaveLength(declarationCount);
        expect(missing).toEqual([]);
      },
    );
  });

  it('derives brand colours from accentHue and logo colours from logoHue', () => {
    const css = buildThemeStyleBlock({
      ...CONSOLE_TOKENS,
      accentHue: MOCK_ACCENT_HUE!,
      logoHue: MOCK_LOGO_HUE!,
    });
    const { root, dark } = splitModes(css);

    expect(readHue(root, BRAND_TOKEN)).toBe(MOCK_ACCENT_HUE);
    expect(readHue(root, LOGO_TOKEN)).toBe(MOCK_LOGO_HUE);
    expect(readHue(dark, BRAND_TOKEN)).toBe(MOCK_ACCENT_HUE);
    expect(readHue(dark, LOGO_TOKEN)).toBe(MOCK_LOGO_HUE);
  });

  it('builds the brand palette stops at accentHue', () => {
    const { root } = splitModes(
      buildThemeStyleBlock({ ...CONSOLE_TOKENS, accentHue: MOCK_ACCENT_HUE! }),
    );

    expect(readHue(root, BRAND_PALETTE_STOP)).toBe(MOCK_ACCENT_HUE);
  });

  it('falls back to accentHue for logo colours when logoHue is unset', () => {
    const css = buildThemeStyleBlock({
      ...CONSOLE_TOKENS,
      accentHue: MOCK_ACCENT_HUE!,
      logoHue: undefined,
    });

    expect(readHue(css, LOGO_TOKEN)).toBe(MOCK_ACCENT_HUE);
  });

  it('tints the brand scrim with the accent hue', () => {
    const css = buildThemeStyleBlock({
      ...CONSOLE_TOKENS,
      accentHue: MOCK_ACCENT_HUE!,
    });

    expect(readHue(css, '--scrim-brand-strong')).toBe(MOCK_ACCENT_HUE);
    expect(readHue(css, '--scrim-brand-mid')).toBe(MOCK_ACCENT_HUE);
    expect(readHue(css, '--scrim-brand-weak')).toBe(MOCK_ACCENT_HUE);
  });

  it.each(STYLE_VALUES)(
    'writes $field $value into the :root block',
    ({ field, value, declarations }) => {
      const { root } = splitModes(
        buildThemeStyleBlock({ ...CONSOLE_TOKENS, [field]: value }),
      );

      expect(missingDeclarations(root, declarations)).toEqual([]);
    },
  );

  it.each(RADIUS_TOKENS)(
    'rounds %s more at each larger radius scale',
    (token) => {
      const sizes = Object.values(RADIUS_SCALE).map((radiusScale) =>
        readPixels(
          buildThemeStyleBlock({ ...CONSOLE_TOKENS, radiusScale }),
          token,
        ),
      );

      expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
      expect(new Set(sizes).size).toBe(sizes.length);
    },
  );

  it.each(SPACING_TOKENS)('changes %s at COMPACT density', (token) => {
    const declaration = new RegExp(`${token}: [^;]+;`);
    const defaultCss = buildThemeStyleBlock(CONSOLE_TOKENS);
    const compactCss = buildThemeStyleBlock({
      ...CONSOLE_TOKENS,
      density: DENSITY.COMPACT,
    });

    const compactDeclaration = compactCss.match(declaration)?.[0];
    const defaultDeclaration = defaultCss.match(declaration)?.[0];

    expect(compactDeclaration).toBe(
      `${token}: ${DENSITY_DECLARATIONS[DENSITY.COMPACT][token]};`,
    );
    expect(compactDeclaration).not.toBe(defaultDeclaration);
  });

  it.each(DARK_EXCLUDED_PREFIXES)(
    'keeps %s tokens out of the .dark block',
    (prefix) => {
      const { dark } = splitModes(
        buildThemeStyleBlock({
          ...CONSOLE_TOKENS,
          cardStyle: CARD_STYLE.OUTLINED,
        }),
      );

      expect(dark).not.toContain(prefix);
    },
  );
});
