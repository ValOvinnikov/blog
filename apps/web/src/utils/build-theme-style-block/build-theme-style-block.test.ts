import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import type { TThemeTokens } from '@blog/config';

import { buildThemeStyleBlock } from './build-theme-style-block';

const CONSOLE_TOKENS: TThemeTokens = {
  accentHue: 250,
  logoHue: 250,
  headingFont: 'SPACE_GROTESK',
  bodyFont: 'NEWSREADER',
  radiusScale: 'MD',
  density: 'DEFAULT',
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
];

const readPixels = (css: string, token: string): number =>
  Number(css.match(new RegExp(`${token}: (\\d+)px;`))?.[1]);

describe('buildThemeStyleBlock', () => {
  it('reproduces the static Console defaults for the no-settings_theme-document case', () => {
    const css = buildThemeStyleBlock(CONSOLE_TOKENS);

    expect(css).toContain('--brand-primary: oklch(0.53 0.17 250);');
    expect(css).toContain('--brand-primary-hover: oklch(0.47 0.17 250);');
    expect(css).toContain('--brand-primary-muted: oklch(0.95 0.03 250);');
    expect(css).toContain('--brand-primary-contrast: oklch(0.99 0 0);');
    expect(css).toContain('--brand-primary-solid: oklch(0.55 0.17 250);');
    expect(css).toContain('--brand-primary-solid-hover: oklch(0.49 0.17 250);');
    expect(css).toContain('--logo-1: oklch(0.52 0.17 250);');
    expect(css).toContain('--logo-2: oklch(0.63 0.16 250);');
    expect(css).toContain('--logo-3: oklch(0.73 0.13 250);');
    expect(css).toContain('--font-ui: var(--font-mono-family);');

    expect(css).toContain('--brand-primary: oklch(0.7 0.16 250);');
    expect(css).toContain('--brand-primary-hover: oklch(0.76 0.16 250);');
    expect(css).toContain('--brand-primary-muted: oklch(0.3 0.06 250);');
    expect(css).toContain('--brand-primary-contrast: oklch(0.16 0.006 250);');
    expect(css).toContain('--brand-primary-solid: oklch(0.7 0.16 250);');
    expect(css).toContain('--brand-primary-solid-hover: oklch(0.76 0.16 250);');
    expect(css).toContain('--logo-1: oklch(0.58 0.17 250);');
    expect(css).toContain('--logo-2: oklch(0.68 0.16 250);');
    expect(css).toContain('--logo-3: oklch(0.8 0.14 250);');
  });

  it('renders :root before .dark', () => {
    const css = buildThemeStyleBlock(CONSOLE_TOKENS);

    expect(css.indexOf(':root')).toBeLessThan(css.indexOf('.dark'));
  });

  it('derives --brand-primary* from accentHue and --logo-* from logoHue independently (Indigo reproduction)', () => {
    const css = buildThemeStyleBlock({
      ...CONSOLE_TOKENS,
      accentHue: 65,
      logoHue: 274,
    });

    expect(css).toContain('--brand-primary: oklch(0.53 0.17 65);');
    expect(css).toContain('--brand-primary-muted: oklch(0.95 0.03 65);');
    expect(css).toContain('--logo-1: oklch(0.52 0.17 274);');
    expect(css).toContain('--logo-2: oklch(0.63 0.16 274);');
    expect(css).toContain('--logo-3: oklch(0.73 0.13 274);');

    expect(css).toContain('--brand-primary: oklch(0.7 0.16 65);');
    expect(css).toContain('--logo-1: oklch(0.58 0.17 274);');
  });

  it('falls back to accentHue for --logo-* when logoHue is unset', () => {
    const css = buildThemeStyleBlock({ ...CONSOLE_TOKENS, logoHue: undefined });

    expect(css).toContain('--logo-1: oklch(0.52 0.17 250);');
  });

  it('renders the editorial preset with its own accentHue', () => {
    const css = buildThemeStyleBlock({
      accentHue: 28,
      logoHue: 28,
      headingFont: 'FRAUNCES',
      bodyFont: 'INTER',
      radiusScale: 'SM',
      density: 'COMPACT',
    });

    expect(css).toContain('--brand-primary: oklch(0.53 0.17 28);');
    expect(css).toContain('--logo-1: oklch(0.52 0.17 28);');
  });

  it('reproduces theme.css radius and layout spacing at MD radius and DEFAULT density', () => {
    const themeCss = readFileSync(
      createRequire(import.meta.url).resolve('@blog/tailwind-config/theme.css'),
      'utf8',
    );
    const staticDeclarations = themeCss.match(
      /--(radius[\w-]*|spacing-(gutter|section|page-y|site-x|site-y|card-x|card-y)): (?!var\()[^;]+;/g,
    );

    expect(staticDeclarations).toHaveLength(12);

    const css = buildThemeStyleBlock(CONSOLE_TOKENS);

    staticDeclarations?.forEach((declaration) => {
      expect(css).toContain(declaration);
    });
  });

  it.each(RADIUS_TOKENS)(
    'rounds %s more at each larger radius scale',
    (token) => {
      const sizes = (['SM', 'MD', 'LG', 'XL'] as const).map((radiusScale) =>
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
      density: 'COMPACT',
    });

    expect(compactCss.match(declaration)?.[0]).toBeDefined();
    expect(compactCss.match(declaration)?.[0]).not.toBe(
      defaultCss.match(declaration)?.[0],
    );
  });

  it('keeps radius and density out of the .dark block', () => {
    const css = buildThemeStyleBlock(CONSOLE_TOKENS);
    const darkBlock = css.slice(css.indexOf('.dark'));

    expect(darkBlock).not.toContain('--radius');
    expect(darkBlock).not.toContain('--spacing-');
  });
});
