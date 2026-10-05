import {
  DENSITY,
  RADIUS_SCALE,
  type TDensity,
  type TRadiusScale,
  type TThemeTokens,
} from '@blog/config';

const RADIUS_DECLARATIONS: Record<TRadiusScale, string[]> = {
  [RADIUS_SCALE.SM]: [
    '--radius-sm: 2px;',
    '--radius: 3px;',
    '--radius-md: 3px;',
    '--radius-lg: 5px;',
    '--radius-xl: 6px;',
  ],
  [RADIUS_SCALE.MD]: [
    '--radius-sm: 3px;',
    '--radius: 6px;',
    '--radius-md: 6px;',
    '--radius-lg: 10px;',
    '--radius-xl: 12px;',
  ],
  [RADIUS_SCALE.LG]: [
    '--radius-sm: 5px;',
    '--radius: 9px;',
    '--radius-md: 9px;',
    '--radius-lg: 15px;',
    '--radius-xl: 18px;',
  ],
  [RADIUS_SCALE.XL]: [
    '--radius-sm: 6px;',
    '--radius: 12px;',
    '--radius-md: 12px;',
    '--radius-lg: 20px;',
    '--radius-xl: 24px;',
  ],
};

const DENSITY_DECLARATIONS: Record<TDensity, string[]> = {
  [DENSITY.DEFAULT]: [
    '--spacing-gutter: clamp(1rem, 5vw, 2.5rem);',
    '--spacing-section: clamp(3rem, 8vw, 6rem);',
    '--spacing-page-y: clamp(1.5rem, 4vw, 2.5rem);',
    '--spacing-site-x: 1.5rem;',
    '--spacing-site-y: 1.375rem;',
    '--spacing-card-x: 1rem;',
    '--spacing-card-y: 0.875rem;',
  ],
  [DENSITY.COMPACT]: [
    '--spacing-gutter: clamp(0.75rem, 3.75vw, 1.875rem);',
    '--spacing-section: clamp(2.25rem, 6vw, 4.5rem);',
    '--spacing-page-y: clamp(1.125rem, 3vw, 1.875rem);',
    '--spacing-site-x: 1.125rem;',
    '--spacing-site-y: 1rem;',
    '--spacing-card-x: 0.75rem;',
    '--spacing-card-y: 0.625rem;',
  ],
};

// Lightness and chroma stay fixed across tenants so contrast ratios hold; only the hue varies.
const buildAccentTokens = (hue: number, isDark: boolean): string => {
  if (isDark) {
    return [
      `--brand-primary: oklch(0.7 0.16 ${hue});`,
      `--brand-primary-hover: oklch(0.76 0.16 ${hue});`,
      `--brand-primary-muted: oklch(0.3 0.06 ${hue});`,
      `--brand-primary-contrast: oklch(0.16 0.006 250);`,
      `--brand-primary-solid: oklch(0.7 0.16 ${hue});`,
      `--brand-primary-solid-hover: oklch(0.76 0.16 ${hue});`,
    ].join('\n    ');
  }

  return [
    `--brand-primary: oklch(0.53 0.17 ${hue});`,
    `--brand-primary-hover: oklch(0.47 0.17 ${hue});`,
    `--brand-primary-muted: oklch(0.95 0.03 ${hue});`,
    `--brand-primary-contrast: oklch(0.99 0 0);`,
    `--brand-primary-solid: oklch(0.55 0.17 ${hue});`,
    `--brand-primary-solid-hover: oklch(0.49 0.17 ${hue});`,
  ].join('\n    ');
};

const buildLogoTokens = (hue: number, isDark: boolean): string => {
  if (isDark) {
    return [
      `--logo-1: oklch(0.58 0.17 ${hue});`,
      `--logo-2: oklch(0.68 0.16 ${hue});`,
      `--logo-3: oklch(0.8 0.14 ${hue});`,
    ].join('\n    ');
  }

  return [
    `--logo-1: oklch(0.52 0.17 ${hue});`,
    `--logo-2: oklch(0.63 0.16 ${hue});`,
    `--logo-3: oklch(0.73 0.13 ${hue});`,
  ].join('\n    ');
};

/**
 * The site's runtime overrides for `configs/tailwind/theme.css`, whose static
 * defaults must stay identical to the Console preset's output so a site with
 * no saved look renders the same.
 */
export const buildThemeStyleBlock = ({
  accentHue,
  logoHue,
  radiusScale,
  density,
}: TThemeTokens): string => {
  const resolvedLogoHue = logoHue ?? accentHue;

  return `:root {
    ${buildAccentTokens(accentHue, false)}
    ${buildLogoTokens(resolvedLogoHue, false)}
    ${RADIUS_DECLARATIONS[radiusScale].join('\n    ')}
    ${DENSITY_DECLARATIONS[density].join('\n    ')}
    --font-ui: var(--font-mono-family);
}
.dark {
    ${buildAccentTokens(accentHue, true)}
    ${buildLogoTokens(resolvedLogoHue, true)}
}`;
};
