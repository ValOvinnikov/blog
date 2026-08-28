import { BRAND_VARIANTS, PRESET_ID } from '@blog/config/constants';
import {
  at,
  createIfNotExists,
  patch,
  set,
  type Mutation,
} from 'sanity/migrate';

/** Matches `settings_theme`'s document `_id` — see `../../src/schema-types/documents/settings/theme.ts`. */
export const THEME_DOCUMENT_ID = 'settings_theme';
export const THEME_DOCUMENT_TYPE = 'settings_theme';

/**
 * The exact `settings_theme` values that reproduce today's `.indigo` CSS
 * class (independently WCAG-verified per #494/#515/#563): `--brand-primary`/
 * `-solid` use hue 65, `--logo-1/2/3` use hue 274. `PRESET_ID.CONSOLE` because
 * Indigo was always a palette swap on top of the Console preset, never its
 * own layout/typography preset.
 */
export const INDIGO_THEME_TARGET = {
  preset: PRESET_ID.CONSOLE,
  accentHue: 65,
  logoHue: 274,
} as const;

export type TSiteSettingsDoc = { brand?: { variant?: string } };
export type TThemeDoc = {
  preset?: string;
  accentHue?: number;
  logoHue?: number;
};

const isAlreadyMigrated = (theme: TThemeDoc | undefined): boolean =>
  theme?.preset === INDIGO_THEME_TARGET.preset &&
  theme?.accentHue === INDIGO_THEME_TARGET.accentHue &&
  theme?.logoHue === INDIGO_THEME_TARGET.logoHue;

/**
 * Pure transform: for a `settings_site` document with `brand.variant ===
 * 'INDIGO'`, builds the mutations that create/update the `settings_theme`
 * singleton to `INDIGO_THEME_TARGET`. `settings_site` documents with any
 * other (or unset) `brand.variant` need no write and return `undefined`.
 *
 * `createIfNotExists` covers the case where `settings_theme` doesn't exist
 * yet; the `patch` alongside it covers the case where it already exists with
 * different values (`createIfNotExists` is a no-op then) — together they
 * converge any starting state to the target. Only `preset`/`accentHue`/
 * `logoHue` are patched, so any other, unrelated `settings_theme` field an
 * editor already set (`headingFont`, `bodyFont`, `radiusScale`, `density`) is
 * left untouched.
 *
 * Idempotency guard: skips (returns `undefined`) once `settings_theme`
 * already matches `INDIGO_THEME_TARGET` exactly — safe to re-run.
 */
export const indigoThemeMutations = (
  site: TSiteSettingsDoc,
  currentTheme: TThemeDoc | undefined,
): Mutation[] | undefined => {
  if (site.brand?.variant !== BRAND_VARIANTS.INDIGO) return undefined;
  if (isAlreadyMigrated(currentTheme)) return undefined;

  return [
    createIfNotExists({
      _id: THEME_DOCUMENT_ID,
      _type: THEME_DOCUMENT_TYPE,
      ...INDIGO_THEME_TARGET,
    }),
    patch(THEME_DOCUMENT_ID, [
      at('preset', set(INDIGO_THEME_TARGET.preset)),
      at('accentHue', set(INDIGO_THEME_TARGET.accentHue)),
      at('logoHue', set(INDIGO_THEME_TARGET.logoHue)),
    ]),
  ];
};
