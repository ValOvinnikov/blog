import type { TThemeToken } from './contrast-pairs';

export const HEADING = '--heading' satisfies TThemeToken;
export const LINK_TEXT = '--link-text' satisfies TThemeToken;
export const LINK_UNDERLINE = '--link-underline' satisfies TThemeToken;
export const EYEBROW_TEXT = '--eyebrow-text' satisfies TThemeToken;
export const EYEBROW_CHIP = '--eyebrow-chip' satisfies TThemeToken;
export const FEATURE_ICON_TILE = '--feature-icon-tile' satisfies TThemeToken;
export const FEATURE_ICON_GLYPH = '--feature-icon-glyph' satisfies TThemeToken;
export const TIER_HIGHLIGHT_BORDER =
  '--tier-highlight-border' satisfies TThemeToken;
export const TIER_BADGE_FILL = '--tier-badge-fill' satisfies TThemeToken;
export const TIER_BADGE_LABEL = '--tier-badge-label' satisfies TThemeToken;
export const TIMELINE_MARKER_FILL =
  '--timeline-marker-fill' satisfies TThemeToken;
export const TIMELINE_MARKER_NUMERAL =
  '--timeline-marker-numeral' satisfies TThemeToken;
export const ASIDE_BAR = '--aside-bar' satisfies TThemeToken;
export const SIDENAV_CURRENT_BAR =
  '--sidenav-current-bar' satisfies TThemeToken;
export const SIDENAV_CURRENT_TEXT =
  '--sidenav-current-text' satisfies TThemeToken;

export const LINK_UNDERLINE_WIDTH = '--link-underline-width';
export const LINK_UNDERLINE_WIDTH_HOVER = '--link-underline-width-hover';
export const TIER_HIGHLIGHT_BORDER_WIDTH = '--tier-highlight-border-width';

export const PRESET_ROLE_LENGTHS = {
  [LINK_UNDERLINE_WIDTH]: '1px',
  [LINK_UNDERLINE_WIDTH_HOVER]: '2px',
  [TIER_HIGHLIGHT_BORDER_WIDTH]: '1px',
} as const satisfies Record<`--${string}`, string>;
