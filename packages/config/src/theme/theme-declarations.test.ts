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
});
