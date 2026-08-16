import type { TThemeTokens } from '@blog/config';

import { buildThemeStyleBlock } from './build-theme-style-block';

const CONSOLE_TOKENS: TThemeTokens = {
  accentHue: 250,
  logoHue: 250,
  headingFont: 'SPACE_GROTESK',
  bodyFont: 'NEWSREADER',
  radiusScale: 'MD',
  density: 'DEFAULT',
  chromeOn: true,
};

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
      chromeOn: false,
    });

    expect(css).toContain('--brand-primary: oklch(0.53 0.17 28);');
    expect(css).toContain('--logo-1: oklch(0.52 0.17 28);');
  });
});
