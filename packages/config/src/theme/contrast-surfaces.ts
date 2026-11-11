import type { TThemeToken } from './contrast-pairs';

export const PRIMARY_SUBTLE = '--primary-subtle' satisfies TThemeToken;
export const SECONDARY = '--secondary' satisfies TThemeToken;
const SURFACE_2 = '--surface-2' satisfies TThemeToken;
export const BRAND_PRIMARY_MUTED =
  '--brand-primary-muted' satisfies TThemeToken;
export const ERROR_MUTED = '--error-muted' satisfies TThemeToken;
export const TEXT = '--text' satisfies TThemeToken;
export const BRAND_PRIMARY = '--brand-primary' satisfies TThemeToken;

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
  '--brand-primary-wash',
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

export const CODE_SURFACES = [
  SURFACE_2,
  BRAND_PRIMARY_MUTED,
] as const satisfies readonly TThemeToken[];
