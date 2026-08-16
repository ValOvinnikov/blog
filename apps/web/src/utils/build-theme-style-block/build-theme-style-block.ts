import type { TThemeTokens } from '@blog/config';

/**
 * Fixed light/dark L·C recipe for the accent and logo token families
 * (`configs/tailwind/theme.css`'s `:root`/`.dark` — only hue rotates per
 * `accentHue`/`logoHue`, see the Phase 2 plan's "Accent OKLCH derivation
 * contract"). `--brand-primary-contrast` is achromatic by design and never
 * varies with hue.
 */
function buildAccentTokens(hue: number, isDark: boolean): string {
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
}

function buildLogoTokens(hue: number, isDark: boolean): string {
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
}

/**
 * Builds the server-rendered `<style>` block content injecting the resolved
 * theme tokens as CSS custom properties under `:root`/`.dark` — the runtime
 * counterpart to `configs/tailwind/theme.css`'s static defaults, which stay
 * byte-identical to the Console preset's own resolved values (the "no
 * `settings_theme` document" safety net). `accentHue` and `logoHue` are
 * applied independently since they no longer always share one hue (see the
 * Phase 2 plan's "retiring the Console/Indigo brand-variant axis").
 *
 * Emits raw `oklch()` CSS rather than pre-converting to hex: every modern
 * browser resolves it natively, and this token only exists to become a CSS
 * custom property, so a hex round-trip would add nothing.
 *
 * @example
 * buildThemeStyleBlock({ accentHue: 250, logoHue: 250, ... }) // ':root { --brand-primary: oklch(...); ... }\n.dark { ... }'
 */
export function buildThemeStyleBlock({
  accentHue,
  logoHue,
}: TThemeTokens): string {
  const resolvedLogoHue = logoHue ?? accentHue;

  return `:root {
    ${buildAccentTokens(accentHue, false)}
    ${buildLogoTokens(resolvedLogoHue, false)}
    --font-ui: var(--font-mono-family);
}
.dark {
    ${buildAccentTokens(accentHue, true)}
    ${buildLogoTokens(resolvedLogoHue, true)}
}`;
}
