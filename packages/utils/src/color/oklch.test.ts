import {
  oklchToHex,
  renderedContrastRatio,
  WCAG_AA_CONTRAST_MIN,
  wcagContrastRatio,
} from './oklch';

describe('oklchToHex', () => {
  it('reproduces the Console light --logo-1 hex from theme.css', () => {
    expect(oklchToHex(0.52, 0.17, 250)).toBe('#006ac5');
  });

  it('reproduces the Console dark --logo-3 hex from theme.css', () => {
    expect(oklchToHex(0.8, 0.14, 250)).toBe('#73c3ff');
  });

  it('converts a high-chroma indigo stop to its hex', () => {
    expect(oklchToHex(0.58, 0.21, 274)).toBe('#5966f3');
  });
});

describe('wcagContrastRatio', () => {
  it('returns ~21:1 for black vs. white', () => {
    const black = { l: 0, c: 0, h: 0 };
    const white = { l: 1, c: 0, h: 0 };
    expect(wcagContrastRatio(black, white)).toBeCloseTo(21, 0);
  });

  it('returns 1 for identical colors', () => {
    const color = { l: 0.5, c: 0.1, h: 250 };
    expect(wcagContrastRatio(color, color)).toBeCloseTo(1, 5);
  });

  it('passes AA for light-mode --text vs. --brand-primary-muted at console hue 250 (borderline)', () => {
    const text = { l: 0.2, c: 0.01, h: 250 };
    const brandPrimaryMuted = { l: 0.95, c: 0.03, h: 250 };
    expect(wcagContrastRatio(text, brandPrimaryMuted)).toBeGreaterThanOrEqual(
      WCAG_AA_CONTRAST_MIN,
    );
  });

  it('passes AA for dark-mode --text vs. --brand-primary-muted at console hue 250', () => {
    const text = { l: 0.95, c: 0.004, h: 250 };
    const brandPrimaryMuted = { l: 0.3, c: 0.06, h: 250 };
    expect(wcagContrastRatio(text, brandPrimaryMuted)).toBeGreaterThanOrEqual(
      WCAG_AA_CONTRAST_MIN,
    );
  });
});

describe('renderedContrastRatio', () => {
  const black = { l: 0, c: 0, h: 0 };
  const white = { l: 1, c: 0, h: 0 };

  it('returns ~21:1 for black on white', () => {
    expect(renderedContrastRatio(black, [white])).toBeCloseTo(21, 0);
  });

  it('composites a translucent foreground over its background', () => {
    expect(
      renderedContrastRatio({ ...white, alpha: 0.5 }, [black]),
    ).toBeCloseTo(5.28, 2);
  });

  it('composites a translucent background layer over the one beneath it', () => {
    expect(
      renderedContrastRatio(black, [white, { ...black, alpha: 0.25 }]),
    ).toBeCloseTo(11.45, 1);
  });

  it('measures an out-of-gamut colour below its unclamped ratio', () => {
    const outOfGamutTeal = { l: 0.53, c: 0.17, h: 190 };

    expect(renderedContrastRatio(outOfGamutTeal, [white])).toBeLessThan(
      wcagContrastRatio(outOfGamutTeal, white),
    );
  });

  it('matches the unclamped ratio for an in-gamut pair', () => {
    const text = { l: 0.2, c: 0.01, h: 250 };
    const surface = { l: 0.975, c: 0.003, h: 250 };

    expect(renderedContrastRatio(text, [surface])).toBeCloseTo(
      wcagContrastRatio(text, surface),
      2,
    );
  });
});
