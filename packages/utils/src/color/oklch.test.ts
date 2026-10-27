import {
  oklchToHex,
  renderedContrastRatio,
  WCAG_AA_CONTRAST_MIN,
} from './oklch';

describe(oklchToHex, () => {
  it.each([
    ['the Console light --logo-1', 0.52, 0.17, 250, '#006ac5'],
    ['the Console dark --logo-3', 0.8, 0.14, 250, '#73c3ff'],
    ['a high-chroma indigo stop', 0.58, 0.21, 274, '#5966f3'],
  ])('converts %s colour to its hex', (_label, l, c, h, hex) => {
    expect(oklchToHex(l, c, h)).toBe(hex);
  });
});

describe(renderedContrastRatio, () => {
  const black = { l: 0, c: 0, h: 0 };
  const white = { l: 1, c: 0, h: 0 };

  it('returns ~21:1 for black on white', () => {
    expect(renderedContrastRatio(black, [white])).toBeCloseTo(21, 0);
  });

  it('composites a translucent foreground over its background', () => {
    const ratio = renderedContrastRatio({ ...white, alpha: 0.5 }, [black]);

    expect(ratio).toBeCloseTo(5.28, 2);
  });

  it('composites a translucent background layer over the one beneath it', () => {
    const ratio = renderedContrastRatio(black, [
      white,
      { ...black, alpha: 0.25 },
    ]);

    expect(ratio).toBeCloseTo(11.45, 1);
  });

  it('measures an out-of-gamut teal below the AA floor on white', () => {
    const outOfGamutTeal = { l: 0.53, c: 0.17, h: 190 };

    expect(renderedContrastRatio(outOfGamutTeal, [white])).toBeLessThan(
      WCAG_AA_CONTRAST_MIN,
    );
  });

  it('measures an in-gamut pair at its plain ratio', () => {
    const text = { l: 0.2, c: 0.01, h: 250 };
    const surface = { l: 0.975, c: 0.003, h: 250 };

    expect(renderedContrastRatio(text, [surface])).toBeCloseTo(16.84, 2);
  });
});
