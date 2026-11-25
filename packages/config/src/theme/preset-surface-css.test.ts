import {
  BRAND_VARIANT,
  COLOR_SCHEME,
  PRESET_ID,
} from '@shinefold/config/constants';
import {
  readCssBlock,
  readCssDeclarations,
  readThemeCss,
} from '@shinefold/config/testing/theme-css';

import type { TThemeToken } from './contrast-pairs';
import { TOKEN_ALIASES } from './contrast-surfaces';
import { skinSchemeSelector } from './css-block';
import {
  ASIDE_BAR,
  EYEBROW_TEXT,
  FEATURE_ICON_GLYPH,
  HEADING,
  LINK_TEXT,
  LINK_UNDERLINE,
  PRESET_ROLE_LENGTHS,
  SIDENAV_CURRENT_BAR,
  SIDENAV_CURRENT_TEXT,
  TIER_BADGE_FILL,
  TIER_BADGE_LABEL,
  TIER_HIGHLIGHT_BORDER,
  TIMELINE_MARKER_FILL,
  TIMELINE_MARKER_NUMERAL,
} from './preset-role-tokens';
import { formatPresetSurfaceBlock } from './preset-surface-css';
import { formatSkinCss } from './skin-css';

const PRESET_ALIAS_ROLES: TThemeToken[] = [
  HEADING,
  LINK_TEXT,
  LINK_UNDERLINE,
  EYEBROW_TEXT,
  FEATURE_ICON_GLYPH,
  TIER_HIGHLIGHT_BORDER,
  TIER_BADGE_FILL,
  TIER_BADGE_LABEL,
  TIMELINE_MARKER_FILL,
  TIMELINE_MARKER_NUMERAL,
  ASIDE_BAR,
  SIDENAV_CURRENT_BAR,
  SIDENAV_CURRENT_TEXT,
];

const MOCK_THEME_CSS = readThemeCss();
const MOCK_SKIN_CSS = formatSkinCss();

const DEFAULT_SCOPES = [
  ['the page', MOCK_THEME_CSS, ':root'],
  ['the dark page', MOCK_THEME_CSS, '.dark'],
  ...Object.values(BRAND_VARIANT).flatMap((variant) =>
    Object.values(COLOR_SCHEME).map((scheme) => [
      `the ${scheme} ${variant} band`,
      MOCK_SKIN_CSS,
      skinSchemeSelector(variant, scheme),
    ]),
  ),
];

const blockOf = (css: string, selector: string): string =>
  css.split(`${selector} {\n`)[1]?.split('\n}')[0] ?? '';

describe('the preset roles with no surfaces of a preset', () => {
  it.each(DEFAULT_SCOPES)(
    'point at the role each replaces on %s',
    (_scope, css, selector) => {
      const declarations = readCssDeclarations(readCssBlock(css!, selector!));
      const mismatched = PRESET_ALIAS_ROLES.filter(
        (role) => declarations[role] !== `var(${TOKEN_ALIASES[role]})`,
      );

      expect(mismatched).toEqual([]);
    },
  );

  it('declares the link underline and tier border widths on the page', () => {
    const declarations = readCssDeclarations(
      readCssBlock(MOCK_THEME_CSS, ':root'),
    );

    expect(declarations).toEqual(expect.objectContaining(PRESET_ROLE_LENGTHS));
  });
});

describe(formatPresetSurfaceBlock, () => {
  it.each([PRESET_ID.CONSOLE, PRESET_ID.EDITORIAL])(
    'declares nothing for %s, which draws the static defaults',
    (preset) => {
      expect(formatPresetSurfaceBlock(preset)).toBe('');
    },
  );

  it('redraws a band in light mode on a dark page when the preset keeps it light', () => {
    const block = blockOf(
      formatPresetSurfaceBlock(PRESET_ID.SHINEFOLD),
      skinSchemeSelector(BRAND_VARIANT.BRAND_PRIMARY, COLOR_SCHEME.DARK),
    );

    expect(block).toContain('color-scheme: light');
    expect(block).toContain('--palette-brand-');
  });

  it('declares only its own values on a band drawn in the page mode', () => {
    const block = blockOf(
      formatPresetSurfaceBlock(PRESET_ID.SHINEFOLD),
      skinSchemeSelector(BRAND_VARIANT.SECONDARY, COLOR_SCHEME.DARK),
    );

    expect(block).not.toContain('color-scheme');
    expect(block).not.toContain('--palette-');
  });
});
