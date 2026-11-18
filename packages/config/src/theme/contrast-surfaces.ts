import type { TThemeToken } from './contrast-pairs';

export const PRIMARY_SUBTLE = '--primary-subtle' satisfies TThemeToken;
export const SECONDARY = '--secondary' satisfies TThemeToken;
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
export const BRAND_PRIMARY_CONTRAST =
  '--brand-primary-contrast' satisfies TThemeToken;
export const ITEM_ACCENT_BRAND_SHARE =
  '--item-accent-brand-share' satisfies TThemeToken;

// A var() in a custom property resolves where it is declared, so a nested scope that moves the target re-declares the alias.
export const TOKEN_ALIASES: Record<TThemeToken, TThemeToken> = {
  '--ring': BRAND_PRIMARY,
  '--info': BRAND_PRIMARY,
  '--info-muted': BRAND_PRIMARY_MUTED,
  '--code-fg': TEXT,
  '--code-comment': TEXT_MUTED,
};

export const BANDS = [
  '--primary',
  PRIMARY_SUBTLE,
  SECONDARY,
  '--surface',
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
  '--primary',
  PRIMARY_SUBTLE,
  '--surface',
] as const satisfies readonly TThemeToken[];

export const TINTED_FIELD_SURFACES = [
  '--surface',
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

// apps/web/index.css declares --code-highlight as this same color-mix(in oklch, …), share as a percentage.
export const MIXED_SURFACES: Partial<
  Record<TThemeToken, { base: TThemeToken; toward: TThemeToken; share: number }>
> = {
  [CODE_HIGHLIGHT]: { base: SURFACE_2, toward: BRAND_PRIMARY, share: 0.1 },
};

export const CODE_SURFACES = [
  SURFACE_2,
  CODE_HIGHLIGHT,
] as const satisfies readonly TThemeToken[];
