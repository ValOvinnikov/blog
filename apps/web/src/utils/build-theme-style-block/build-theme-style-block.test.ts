import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import {
  type TThemeTokens,
  CARD_STYLE,
  CARD_STYLE_DECLARATIONS,
  DENSITY,
  DENSITY_DECLARATIONS,
  HEADER_CONTROL_STYLE,
  HEADER_CONTROL_STYLE_DECLARATIONS,
  PRESET_ID,
  PRESET_REGISTRY,
  RADIUS_SCALE,
} from '@blog/config';
import { faker } from '@faker-js/faker';

import { buildThemeStyleBlock } from './build-theme-style-block';

faker.seed(107);

const DARK_SELECTOR = '.dark';
const BRAND_TOKEN = '--brand-primary';
const LOGO_TOKEN = '--logo-1';
const BRAND_AND_LOGO_NAMES = 'brand-primary[\\w-]*|logo-\\d';
const CONSOLE_PRESET_TOKENS = PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;
const EDITORIAL_TOKENS = PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens;
const CONSOLE_HUE = CONSOLE_PRESET_TOKENS.accentHue;
const [MOCK_ACCENT_HUE, MOCK_LOGO_HUE] = faker.helpers.uniqueArray(
  () => faker.number.int({ min: 0, max: 360 }),
  2,
);

const CONSOLE_TOKENS: TThemeTokens = {
  ...CONSOLE_PRESET_TOKENS,
  logoHue: CONSOLE_HUE,
};

const THEME_CSS = readFileSync(
  createRequire(import.meta.url).resolve('@blog/tailwind-config/theme.css'),
  'utf8',
);
const THEME_ROOT_BLOCK = THEME_CSS.slice(
  THEME_CSS.indexOf(':root {'),
  THEME_CSS.indexOf(`${DARK_SELECTOR} {`),
);
const THEME_DARK_BLOCK = THEME_CSS.slice(
  THEME_CSS.indexOf(`${DARK_SELECTOR} {`),
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
  '--scrim-',
  '--on-image',
];

const splitModes = (css: string) => ({
  root: css.slice(0, css.indexOf(DARK_SELECTOR)),
  dark: css.slice(css.indexOf(DARK_SELECTOR)),
});

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
  it('renders :root before .dark', () => {
    const css = buildThemeStyleBlock(CONSOLE_TOKENS);

    expect(css.indexOf(':root')).toBeLessThan(css.indexOf(DARK_SELECTOR));
  });

  describe('against the static theme.css defaults', () => {
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
    ])('reproduces the $group', ({ source, names, scope }) => {
      const staticDeclarations = declarationsMatchingAny(source, names);
      const css = splitModes(buildThemeStyleBlock(CONSOLE_TOKENS))[scope];

      const missing = staticDeclarations.filter(
        (declaration) => !css.includes(declaration),
      );

      expect(staticDeclarations.length).toBeGreaterThan(0);
      expect(missing).toEqual([]);
    });

    it('reproduces the radius and layout spacing tokens', () => {
      const staticDeclarations = declarationsMatching(
        THEME_CSS,
        'radius[\\w-]*|spacing-(?:gutter|section|page-y|site-x|site-y|card-x|card-y|card-gap|band)',
      );
      const { root } = splitModes(buildThemeStyleBlock(CONSOLE_TOKENS));

      const missing = staticDeclarations.filter(
        (declaration) => !root.includes(declaration),
      );

      expect(staticDeclarations.length).toBeGreaterThan(0);
      expect(missing).toEqual([]);
    });
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

  it('falls back to accentHue for logo colours when logoHue is unset', () => {
    const css = buildThemeStyleBlock({
      ...CONSOLE_TOKENS,
      accentHue: MOCK_ACCENT_HUE!,
      logoHue: undefined,
    });

    expect(readHue(css, LOGO_TOKEN)).toBe(MOCK_ACCENT_HUE);
  });

  it('renders the editorial preset with its own accentHue', () => {
    const { accentHue } = EDITORIAL_TOKENS;
    const css = buildThemeStyleBlock({
      ...EDITORIAL_TOKENS,
      logoHue: accentHue,
    });

    expect(readHue(css, BRAND_TOKEN)).toBe(accentHue);
    expect(readHue(css, LOGO_TOKEN)).toBe(accentHue);
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

  it('leaves the neutral scrim to the static theme', () => {
    const css = buildThemeStyleBlock(CONSOLE_TOKENS);

    expect(css).not.toContain('--scrim-neutral');
  });

  it('defaults to the accent-bar card style', () => {
    const defaultCss = buildThemeStyleBlock(CONSOLE_TOKENS);
    const accentBarCss = buildThemeStyleBlock({
      ...CONSOLE_TOKENS,
      cardStyle: CARD_STYLE.ACCENT_BAR,
    });

    expect(defaultCss).toBe(accentBarCss);
  });

  it.each(Object.values(CARD_STYLE))(
    'writes the %s card declarations into :root',
    (cardStyle) => {
      const { root } = splitModes(
        buildThemeStyleBlock({ ...CONSOLE_TOKENS, cardStyle }),
      );

      const missing = Object.entries(CARD_STYLE_DECLARATIONS[cardStyle])
        .map(([property, value]) => `${property}: ${value};`)
        .filter((declaration) => !root.includes(declaration));

      expect(missing).toEqual([]);
    },
  );

  it('defaults to the outlined header control style', () => {
    const defaultCss = buildThemeStyleBlock(CONSOLE_TOKENS);
    const outlinedCss = buildThemeStyleBlock({
      ...CONSOLE_TOKENS,
      headerControlStyle: HEADER_CONTROL_STYLE.OUTLINED,
    });

    expect(defaultCss).toBe(outlinedCss);
  });

  it.each(Object.values(HEADER_CONTROL_STYLE))(
    'writes the %s header control declarations into :root',
    (headerControlStyle) => {
      const { root } = splitModes(
        buildThemeStyleBlock({ ...CONSOLE_TOKENS, headerControlStyle }),
      );

      const missing = Object.entries(
        HEADER_CONTROL_STYLE_DECLARATIONS[headerControlStyle],
      )
        .map(([property, value]) => `${property}: ${value};`)
        .filter((declaration) => !root.includes(declaration));

      expect(missing).toEqual([]);
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
