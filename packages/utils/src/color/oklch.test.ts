import { oklchToHex, WCAG_AA_CONTRAST_MIN, wcagContrastRatio } from './oklch';

describe('oklchToHex', () => {
  it('reproduces the Console light --logo-1 hex from theme.css', () => {
    expect(oklchToHex(0.52, 0.17, 250)).toBe('#006ac5');
  });

  it('reproduces the Console dark --logo-3 hex from theme.css', () => {
    expect(oklchToHex(0.8, 0.14, 250)).toBe('#73c3ff');
  });

  it('reproduces the Indigo light --logo-alt-2 hex from theme.css', () => {
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
