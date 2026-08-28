import {
  accentHueGradient,
  buildAccentPreviewTokens,
  buildLogoPreviewTokens,
} from './theme-preview-tokens';

describe('buildAccentPreviewTokens', () => {
  it('matches the light-mode ramp from build-theme-style-block.ts', () => {
    expect(buildAccentPreviewTokens(250, false)).toEqual({
      '--brand-primary': 'oklch(0.53 0.17 250)',
      '--brand-primary-hover': 'oklch(0.47 0.17 250)',
      '--brand-primary-muted': 'oklch(0.95 0.03 250)',
      '--brand-primary-contrast': 'oklch(0.99 0 0)',
      '--brand-primary-solid': 'oklch(0.55 0.17 250)',
      '--brand-primary-solid-hover': 'oklch(0.49 0.17 250)',
    });
  });

  it('matches the dark-mode ramp, including the constant contrast token', () => {
    expect(buildAccentPreviewTokens(28, true)).toEqual({
      '--brand-primary': 'oklch(0.7 0.16 28)',
      '--brand-primary-hover': 'oklch(0.76 0.16 28)',
      '--brand-primary-muted': 'oklch(0.3 0.06 28)',
      '--brand-primary-contrast': 'oklch(0.16 0.006 250)',
      '--brand-primary-solid': 'oklch(0.7 0.16 28)',
      '--brand-primary-solid-hover': 'oklch(0.76 0.16 28)',
    });
  });
});

describe('buildLogoPreviewTokens', () => {
  it('matches the light-mode logo ramp', () => {
    expect(buildLogoPreviewTokens(250, false)).toEqual({
      '--logo-1': 'oklch(0.52 0.17 250)',
      '--logo-2': 'oklch(0.63 0.16 250)',
      '--logo-3': 'oklch(0.73 0.13 250)',
    });
  });

  it('matches the dark-mode logo ramp', () => {
    expect(buildLogoPreviewTokens(250, true)).toEqual({
      '--logo-1': 'oklch(0.58 0.17 250)',
      '--logo-2': 'oklch(0.68 0.16 250)',
      '--logo-3': 'oklch(0.8 0.14 250)',
    });
  });
});

describe(accentHueGradient, () => {
  it('samples the fixed light-mode formula across the full hue range', () => {
    const gradient = accentHueGradient();

    expect(gradient.startsWith('linear-gradient(90deg,')).toBe(true);
    expect(gradient).toContain('oklch(0.53 0.17 0)');
    expect(gradient).toContain('oklch(0.53 0.17 180)');
    expect(gradient).toContain('oklch(0.53 0.17 360)');
  });
});
