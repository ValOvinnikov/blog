import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import {
  type TThemeTokens,
  CARD_STYLE,
  CARD_STYLE_DECLARATIONS,
  DENSITY,
  HEADER_CONTROL_STYLE,
  HEADER_CONTROL_STYLE_DECLARATIONS,
  PRESET_ID,
  PRESET_REGISTRY,
  RADIUS_SCALE,
} from '@blog/config';

import { buildThemeStyleBlock } from './build-theme-style-block';

const CONSOLE_PRESET_TOKENS = PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;
const EDITORIAL_TOKENS = PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens;
const CONSOLE_HUE = CONSOLE_PRESET_TOKENS.accentHue;
const ACCENT_HUE = 65;
const LOGO_HUE = 274;

const CONSOLE_TOKENS: TThemeTokens = {
  ...CONSOLE_PRESET_TOKENS,
  logoHue: CONSOLE_HUE,
};

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
];

const readPixels = (css: string, token: string): number =>
  Number(css.match(new RegExp(`${token}: (\\d+)px;`))?.[1]);

describe('buildThemeStyleBlock', () => {
  it('reproduces the static Console defaults', () => {
    const css = buildThemeStyleBlock(CONSOLE_TOKENS);

    expect(css).toContain(`--brand-primary: oklch(0.45 0.17 ${CONSOLE_HUE});`);
    expect(css).toContain(
      `--brand-primary-hover: oklch(0.39 0.17 ${CONSOLE_HUE});`,
    );
    expect(css).toContain(
      `--brand-primary-muted: oklch(0.95 0.03 ${CONSOLE_HUE});`,
    );
    expect(css).toContain('--brand-primary-contrast: oklch(0.99 0 0);');
    expect(css).toContain(
      `--brand-primary-solid: oklch(0.51 0.17 ${CONSOLE_HUE});`,
    );
    expect(css).toContain(
      `--brand-primary-solid-hover: oklch(0.45 0.17 ${CONSOLE_HUE});`,
    );
    expect(css).toContain(`--logo-1: oklch(0.52 0.17 ${CONSOLE_HUE});`);
    expect(css).toContain(`--logo-2: oklch(0.63 0.16 ${CONSOLE_HUE});`);
    expect(css).toContain(`--logo-3: oklch(0.73 0.13 ${CONSOLE_HUE});`);

    expect(css).toContain(`--brand-primary: oklch(0.7 0.16 ${CONSOLE_HUE});`);
    expect(css).toContain(
      `--brand-primary-hover: oklch(0.76 0.16 ${CONSOLE_HUE});`,
    );
    expect(css).toContain(
      `--brand-primary-muted: oklch(0.3 0.06 ${CONSOLE_HUE});`,
    );
    expect(css).toContain(
      `--brand-primary-contrast: oklch(0.16 0.006 ${CONSOLE_HUE});`,
    );
    expect(css).toContain(
      `--brand-primary-solid: oklch(0.7 0.16 ${CONSOLE_HUE});`,
    );
    expect(css).toContain(
      `--brand-primary-solid-hover: oklch(0.76 0.16 ${CONSOLE_HUE});`,
    );
    expect(css).toContain(`--logo-1: oklch(0.58 0.17 ${CONSOLE_HUE});`);
    expect(css).toContain(`--logo-2: oklch(0.68 0.16 ${CONSOLE_HUE});`);
    expect(css).toContain(`--logo-3: oklch(0.8 0.14 ${CONSOLE_HUE});`);
  });

  it('renders :root before .dark', () => {
    const css = buildThemeStyleBlock(CONSOLE_TOKENS);

    expect(css.indexOf(':root')).toBeLessThan(css.indexOf('.dark'));
  });

  it('derives --brand-primary* from accentHue and --logo-* from logoHue independently (Indigo reproduction)', () => {
    const css = buildThemeStyleBlock({
      ...CONSOLE_TOKENS,
      accentHue: ACCENT_HUE,
      logoHue: LOGO_HUE,
    });

    expect(css).toContain(`--brand-primary: oklch(0.45 0.17 ${ACCENT_HUE});`);
    expect(css).toContain(
      `--brand-primary-muted: oklch(0.95 0.03 ${ACCENT_HUE});`,
    );
    expect(css).toContain(`--logo-1: oklch(0.52 0.17 ${LOGO_HUE});`);
    expect(css).toContain(`--logo-2: oklch(0.63 0.16 ${LOGO_HUE});`);
    expect(css).toContain(`--logo-3: oklch(0.73 0.13 ${LOGO_HUE});`);

    expect(css).toContain(`--brand-primary: oklch(0.7 0.16 ${ACCENT_HUE});`);
    expect(css).toContain(`--logo-1: oklch(0.58 0.17 ${LOGO_HUE});`);
  });

  it('falls back to accentHue for --logo-* when logoHue is unset', () => {
    const css = buildThemeStyleBlock({ ...CONSOLE_TOKENS, logoHue: undefined });

    expect(css).toContain(`--logo-1: oklch(0.52 0.17 ${CONSOLE_HUE});`);
  });

  it('renders the editorial preset with its own accentHue', () => {
    const { accentHue } = EDITORIAL_TOKENS;
    const css = buildThemeStyleBlock({
      ...EDITORIAL_TOKENS,
      logoHue: accentHue,
    });

    expect(css).toContain(`--brand-primary: oklch(0.45 0.17 ${accentHue});`);
    expect(css).toContain(`--logo-1: oklch(0.52 0.17 ${accentHue});`);
  });

  it('reproduces theme.css radius and layout spacing at MD radius and DEFAULT density', () => {
    const themeCss = readFileSync(
      createRequire(import.meta.url).resolve('@blog/tailwind-config/theme.css'),
      'utf8',
    );
    const staticDeclarations = themeCss.match(
      /--(radius[\w-]*|spacing-(gutter|section|page-y|site-x|site-y|card-x|card-y|card-gap|band)): (?!var\()[^;]+;/g,
    );

    expect(staticDeclarations).toHaveLength(14);

    const css = buildThemeStyleBlock(CONSOLE_TOKENS);

    staticDeclarations?.forEach((declaration) => {
      expect(css).toContain(declaration);
    });
  });

  it('reproduces theme.css item-card tokens for the accent-bar card style', () => {
    const themeCss = readFileSync(
      createRequire(import.meta.url).resolve('@blog/tailwind-config/theme.css'),
      'utf8',
    );
    const itemDeclarations = themeCss.match(/--item-[\w-]+: [^;]+;/g);

    expect(itemDeclarations?.length).toBeGreaterThan(0);

    const accentBarCss = buildThemeStyleBlock({
      ...CONSOLE_TOKENS,
      cardStyle: CARD_STYLE.ACCENT_BAR,
    });
    const unsetCss = buildThemeStyleBlock(CONSOLE_TOKENS);

    itemDeclarations?.forEach((declaration) => {
      expect(accentBarCss).toContain(declaration);
      expect(unsetCss).toContain(declaration);
    });
  });

  it('draws outlined item cards with a uniform border and rounded corners', () => {
    const css = buildThemeStyleBlock({
      ...CONSOLE_TOKENS,
      cardStyle: CARD_STYLE.OUTLINED,
    });
    const read = (token: string) =>
      css.match(new RegExp(`${token}: ([^;]+);`))?.[1];

    expect(read('--item-accent-width')).toBe(read('--item-border-width'));
    expect(read('--item-accent-color')).toBe(
      CARD_STYLE_DECLARATIONS[CARD_STYLE.OUTLINED]['--item-accent-color'],
    );
    expect(read('--item-radius')).toMatch(/^var\(--radius-/);
  });

  it('reproduces theme.css header control tokens for the outlined style', () => {
    const themeCss = readFileSync(
      createRequire(import.meta.url).resolve('@blog/tailwind-config/theme.css'),
      'utf8',
    );
    const headerControlDeclarations = themeCss.match(
      /--header-control-[\w-]+: [^;]+;/g,
    );

    expect(headerControlDeclarations?.length).toBeGreaterThan(0);

    const outlinedCss = buildThemeStyleBlock({
      ...CONSOLE_TOKENS,
      headerControlStyle: HEADER_CONTROL_STYLE.OUTLINED,
    });
    const unsetCss = buildThemeStyleBlock(CONSOLE_TOKENS);

    headerControlDeclarations?.forEach((declaration) => {
      expect(outlinedCss).toContain(declaration);
      expect(unsetCss).toContain(declaration);
    });
  });

  it.each(Object.values(HEADER_CONTROL_STYLE))(
    'writes the %s header control declarations into :root',
    (headerControlStyle) => {
      const css = buildThemeStyleBlock({
        ...CONSOLE_TOKENS,
        headerControlStyle,
      });
      const rootBlock = css.slice(0, css.indexOf('.dark'));

      Object.entries(
        HEADER_CONTROL_STYLE_DECLARATIONS[headerControlStyle],
      ).forEach(([property, value]) => {
        expect(rootBlock).toContain(`${property}: ${value};`);
      });
    },
  );

  it('reproduces theme.css on-image and brand scrim tokens at the Console accent hue', () => {
    const themeCss = readFileSync(
      createRequire(import.meta.url).resolve('@blog/tailwind-config/theme.css'),
      'utf8',
    );
    const imageDeclarations = themeCss.match(
      /--(on-image[\w-]*|scrim-brand-[\w-]+): [^;]+;/g,
    );

    expect(imageDeclarations).toHaveLength(5);

    const css = buildThemeStyleBlock(CONSOLE_TOKENS);

    imageDeclarations?.forEach((declaration) => {
      expect(css).toContain(declaration);
    });
  });

  it('tints the brand scrim with the accent hue and keeps on-image copy and the neutral scrim hue-free', () => {
    const css = buildThemeStyleBlock({
      ...CONSOLE_TOKENS,
      accentHue: ACCENT_HUE,
    });

    expect(css).toContain(
      `--scrim-brand-strong: oklch(0.2 0.06 ${ACCENT_HUE} / 0.92);`,
    );
    expect(css).toContain(
      `--scrim-brand-mid: oklch(0.35 0.12 ${ACCENT_HUE} / 0.72);`,
    );
    expect(css).toContain(
      `--scrim-brand-weak: oklch(0.45 0.14 ${ACCENT_HUE} / 0.4);`,
    );
    expect(css).toContain('--on-image: oklch(1 0 0);');
    expect(css).not.toContain('--scrim-neutral');
  });

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

    expect(compactCss.match(declaration)?.[0]).toBeDefined();
    expect(compactCss.match(declaration)?.[0]).not.toBe(
      defaultCss.match(declaration)?.[0],
    );
  });

  it('keeps radius, density and card style out of the .dark block', () => {
    const css = buildThemeStyleBlock({
      ...CONSOLE_TOKENS,
      cardStyle: CARD_STYLE.OUTLINED,
    });
    const darkBlock = css.slice(css.indexOf('.dark'));

    expect(darkBlock).not.toContain('--radius');
    expect(darkBlock).not.toContain('--spacing-');
    expect(darkBlock).not.toContain('--item-');
    expect(darkBlock).not.toContain('--header-control-');
    expect(darkBlock).not.toContain('--scrim-');
    expect(darkBlock).not.toContain('--on-image');
  });
});
