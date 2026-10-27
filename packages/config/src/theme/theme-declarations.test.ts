import { formatOklchRamp } from './theme-declarations';

const MOCK_TENANT_HUE = 28;

describe(formatOklchRamp, () => {
  it('fills the tenant hue into every stop that has no hue of its own', () => {
    const ramp = formatOklchRamp(
      {
        '--accent': { l: 0.53, c: 0.17 },
        '--contrast': { l: 0.16, c: 0.006, h: 250 },
      },
      MOCK_TENANT_HUE,
    );

    expect(ramp).toEqual({
      '--accent': `oklch(0.53 0.17 ${MOCK_TENANT_HUE})`,
      '--contrast': 'oklch(0.16 0.006 250)',
    });
  });

  it('appends an alpha channel to a stop that carries one', () => {
    const ramp = formatOklchRamp(
      { '--scrim': { l: 0.2, c: 0.06, alpha: 0.92 } },
      MOCK_TENANT_HUE,
    );

    expect(ramp).toEqual({
      '--scrim': `oklch(0.2 0.06 ${MOCK_TENANT_HUE} / 0.92)`,
    });
  });
});
