import type { TThemeToken } from './contrast-pairs';
import {
  ASIDE_BAR,
  EYEBROW_TEXT,
  FEATURE_ICON_GLYPH,
  HEADING,
  LINK_TEXT,
  LINK_UNDERLINE,
  SIDENAV_CURRENT_BAR,
  SIDENAV_CURRENT_TEXT,
  TIER_BADGE_FILL,
  TIER_BADGE_LABEL,
  TIER_HIGHLIGHT_BORDER,
  TIMELINE_MARKER_FILL,
  TIMELINE_MARKER_NUMERAL,
} from './preset-role-tokens';

export const PRIMARY_SUBTLE = '--primary-subtle' satisfies TThemeToken;
export const SECONDARY = '--secondary' satisfies TThemeToken;
export const PRIMARY = '--primary' satisfies TThemeToken;
export const BORDER = '--border' satisfies TThemeToken;
export const SURFACE = '--surface' satisfies TThemeToken;
export const SURFACE_2 = '--surface-2' satisfies TThemeToken;
export const BRAND_PRIMARY_MUTED =
  '--brand-primary-muted' satisfies TThemeToken;
export const ERROR = '--error' satisfies TThemeToken;
export const ERROR_MUTED = '--error-muted' satisfies TThemeToken;
export const AMBIENT = '--ambient' satisfies TThemeToken;
export const AMBIENT_RAISED = '--ambient-raised' satisfies TThemeToken;
export const FIELD_BOUNDARY = '--field-boundary' satisfies TThemeToken;
export const TEXT = '--text' satisfies TThemeToken;
export const TEXT_MUTED = '--text-muted' satisfies TThemeToken;
export const BORDER_EMPHASIS = '--border-emphasis' satisfies TThemeToken;
export const BRAND_PRIMARY_WASH = '--brand-primary-wash' satisfies TThemeToken;
export const BRAND_PRIMARY = '--brand-primary' satisfies TThemeToken;
export const BRAND_PRIMARY_SOLID =
  '--brand-primary-solid' satisfies TThemeToken;
export const BRAND_PRIMARY_SOLID_HOVER =
  '--brand-primary-solid-hover' satisfies TThemeToken;
export const BRAND_PRIMARY_CONTRAST =
  '--brand-primary-contrast' satisfies TThemeToken;
export const BUTTON_FILL = '--button-fill' satisfies TThemeToken;
export const BUTTON_FILL_HOVER = '--button-fill-hover' satisfies TThemeToken;
export const BUTTON_LABEL = '--button-label' satisfies TThemeToken;
export const ITEM_ACCENT_BRAND_SHARE =
  '--item-accent-brand-share' satisfies TThemeToken;

// A var() in a custom property resolves where it is declared, so a nested scope that moves the target re-declares the alias.
export const TOKEN_ALIASES: Record<TThemeToken, TThemeToken> = {
  '--ring': BRAND_PRIMARY,
  '--info': BRAND_PRIMARY,
  '--info-muted': BRAND_PRIMARY_MUTED,
  '--heading-highlight': BRAND_PRIMARY,
  '--code-fg': TEXT,
  '--code-comment': TEXT_MUTED,
  [BUTTON_FILL]: BRAND_PRIMARY_SOLID,
  [BUTTON_FILL_HOVER]: BRAND_PRIMARY_SOLID_HOVER,
  [BUTTON_LABEL]: BRAND_PRIMARY_CONTRAST,
  [HEADING]: TEXT,
  [LINK_TEXT]: BRAND_PRIMARY,
  [LINK_UNDERLINE]: BRAND_PRIMARY,
  [EYEBROW_TEXT]: BRAND_PRIMARY,
  [FEATURE_ICON_GLYPH]: BRAND_PRIMARY,
  [TIER_HIGHLIGHT_BORDER]: BRAND_PRIMARY,
  [TIER_BADGE_FILL]: BRAND_PRIMARY_SOLID,
  [TIER_BADGE_LABEL]: BRAND_PRIMARY_CONTRAST,
  [TIMELINE_MARKER_FILL]: BRAND_PRIMARY_SOLID,
  [TIMELINE_MARKER_NUMERAL]: BRAND_PRIMARY_CONTRAST,
  [ASIDE_BAR]: BRAND_PRIMARY_MUTED,
  [SIDENAV_CURRENT_BAR]: BRAND_PRIMARY,
  [SIDENAV_CURRENT_TEXT]: BRAND_PRIMARY,
};

export const BANDS = [
  PRIMARY,
  PRIMARY_SUBTLE,
  SECONDARY,
  SURFACE,
  SURFACE_2,
  BRAND_PRIMARY_MUTED,
] as const satisfies readonly TThemeToken[];

export const FILLED_ITEM_SURFACES = [
  ...BANDS,
  BRAND_PRIMARY_WASH,
] as const satisfies readonly TThemeToken[];

export const TEXT_SURFACES = [
  ...FILLED_ITEM_SURFACES,
  ERROR_MUTED,
] as const satisfies readonly TThemeToken[];

export const FIELD_SURFACES = [
  PRIMARY,
  PRIMARY_SUBTLE,
  SURFACE,
] as const satisfies readonly TThemeToken[];

export const TINTED_FIELD_SURFACES = [
  SURFACE,
  SECONDARY,
  BRAND_PRIMARY_MUTED,
] as const satisfies readonly TThemeToken[];

export const SCRIM_STOPS_UNDER_COPY = [
  '--scrim-brand-strong',
  '--scrim-brand-mid',
  '--scrim-neutral-strong',
  '--scrim-neutral-mid',
] as const satisfies readonly TThemeToken[];

export const CODE_HIGHLIGHT = '--code-highlight' satisfies TThemeToken;

export const MIXED_SURFACES: Partial<
  Record<TThemeToken, { base: TThemeToken; toward: TThemeToken; share: number }>
> = {
  [CODE_HIGHLIGHT]: { base: SURFACE_2, toward: BRAND_PRIMARY, share: 0.1 },
};

export const CODE_SURFACES = [
  SURFACE_2,
  CODE_HIGHLIGHT,
] as const satisfies readonly TThemeToken[];
