import { formatOklchRamp } from './theme-declarations';

describe(formatOklchRamp, () => {
  it('fills the tenant hue into every stop that has no hue of its own', () => {
    expect(
      formatOklchRamp(
        {
          '--accent': { l: 0.53, c: 0.17 },
          '--contrast': { l: 0.16, c: 0.006, h: 250 },
        },
        28,
      ),
    ).toEqual({
      '--accent': 'oklch(0.53 0.17 28)',
      '--contrast': 'oklch(0.16 0.006 250)',
    });
  });

  it('appends an alpha channel to a stop that carries one', () => {
    expect(
      formatOklchRamp({ '--scrim': { l: 0.2, c: 0.06, alpha: 0.92 } }, 28),
    ).toEqual({ '--scrim': 'oklch(0.2 0.06 28 / 0.92)' });
  });
});
