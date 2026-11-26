import {
  BRAND_VARIANT,
  COLOR_SCHEME,
  PRESET_ID,
} from '@shinefold/config/constants';
import {
  readCssBlock,
  readCssDeclarations,
  readDefaultRoleScopes,
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

describe('the preset roles with no surfaces of a preset', () => {
  it.each(readDefaultRoleScopes())(
    'point at the role each replaces on %s',
    (_scope, css, selector) => {
      const declarations = readCssDeclarations(readCssBlock(css, selector));
      const mismatched = PRESET_ALIAS_ROLES.filter(
        (role) => declarations[role] !== `var(${TOKEN_ALIASES[role]})`,
      );

      expect(mismatched).toEqual([]);
    },
  );

  it('declares the link underline and tier border widths on the page', () => {
    const declarations = readCssDeclarations(
      readCssBlock(readThemeCss(), ':root'),
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
    const block = readCssBlock(
      formatPresetSurfaceBlock(PRESET_ID.SHINEFOLD),
      skinSchemeSelector(BRAND_VARIANT.BRAND_PRIMARY, COLOR_SCHEME.DARK),
    );

    expect(block).toContain('color-scheme: light');
    expect(block).toContain('--palette-brand-');
  });

  it('declares only its own values on a band drawn in the page mode', () => {
    const block = readCssBlock(
      formatPresetSurfaceBlock(PRESET_ID.SHINEFOLD),
      skinSchemeSelector(BRAND_VARIANT.SECONDARY, COLOR_SCHEME.DARK),
    );

    expect(block).not.toContain('color-scheme');
    expect(block).not.toContain('--palette-');
  });
});
