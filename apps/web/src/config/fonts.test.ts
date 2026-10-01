import { FONT_CHOICE } from '@blog/config';

import { resolveFontVariableClassName } from './fonts';

vi.mock('next/font/local', () => ({
  default: ({ src }: { src: [{ path: string }, ...{ path: string }[]] }) => {
    const fontName = src[0].path.replace(/^.*\//, '').replace('.woff2', '');
    return {
      className: `mock-${fontName}-className`,
      variable: `mock-${fontName}-variable`,
    };
  },
}));

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
