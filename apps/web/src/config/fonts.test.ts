import { FONT_CHOICE } from '@blog/config';

import { resolveFontVariableClassName } from './fonts';

// Overrides the global `next/font/google` stub from `vitest-setup.ts` (which
// echoes back the `variable` *option* it was given — indistinguishable here,
// since every heading font shares `--font-display-family` and every body
// font shares `--font-body-family`) with one keyed by font name instead, so
// assertions below can tell which specific font actually resolved.
vi.mock('next/font/google', () => {
  const createFontMock = (fontName: string) => () => ({
    className: `mock-${fontName}-className`,
    variable: `mock-${fontName}-variable`,
  });

  return {
    Space_Grotesk: createFontMock('space-grotesk'),
    Fraunces: createFontMock('fraunces'),
    Newsreader: createFontMock('newsreader'),
    Inter: createFontMock('inter'),
    JetBrains_Mono: createFontMock('jetbrains-mono'),
  };
});

describe('resolveFontVariableClassName', () => {
  it('resolves SPACE_GROTESK/NEWSREADER to their own variable classes', () => {
    const result = resolveFontVariableClassName(
      FONT_CHOICE.SPACE_GROTESK,
      FONT_CHOICE.NEWSREADER,
    );

    expect(result).toBe(
      'mock-space-grotesk-variable mock-newsreader-variable mock-jetbrains-mono-variable',
    );
  });

  it('resolves FRAUNCES/INTER to their own variable classes', () => {
    const result = resolveFontVariableClassName(
      FONT_CHOICE.FRAUNCES,
      FONT_CHOICE.INTER,
    );

    expect(result).toBe(
      'mock-fraunces-variable mock-inter-variable mock-jetbrains-mono-variable',
    );
  });

  it('falls back to the Console default heading font for an unmapped choice', () => {
    const result = resolveFontVariableClassName(
      FONT_CHOICE.JETBRAINS_MONO,
      FONT_CHOICE.NEWSREADER,
    );

    expect(result).toBe(
      'mock-space-grotesk-variable mock-newsreader-variable mock-jetbrains-mono-variable',
    );
  });

  it('falls back to the Console default body font for an unmapped choice', () => {
    const result = resolveFontVariableClassName(
      FONT_CHOICE.SPACE_GROTESK,
      FONT_CHOICE.JETBRAINS_MONO,
    );

    expect(result).toBe(
      'mock-space-grotesk-variable mock-newsreader-variable mock-jetbrains-mono-variable',
    );
  });
});
