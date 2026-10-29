import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  BRAND_VARIANT,
  BUSY_BUTTON_STYLE,
  CARD_STYLE,
  COOKIE_SETTINGS_BUTTON,
  DENSITY,
  LANGUAGE_SWITCHER_STYLE,
  FONT_CHOICE,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  HEADER_BAR_STYLE,
  HEADER_CONTROL_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  HUE_MAX,
  HUE_MIN,
  PRESET_ID,
  RADIUS_SCALE,
  SPINNER_STYLE,
} from '@blog/config/constants';
import { LOOK_FIELD } from '@blog/db/constants';
import type { siteConfig } from '@blog/db/schema/site-config';
import { isUndefined } from '@blog/utils/primitives';
import { z } from 'zod';

import type { TVoiceOverridesByLocaleInput } from './parse-voice-overrides';

const hueSchema = z.number().int().min(HUE_MIN).max(HUE_MAX);

// A field absent from the input is left untouched on `UPDATE` and takes the
// preset's value on `INSERT`: Look and Voice save separately, and a plan may
// keep a Look field from being written. `logoHue`/`logoAssetUrl`/`faviconAssetUrl`
// accept an explicit `null` to clear them, since `undefined` alone can't
// express "unset this". A Voice save replaces the map of each locale it
// carries (even with `{}`) and leaves every other locale's map untouched.
export const updateSiteConfigInputSchema = z.object({
  preset: z.enum(PRESET_ID),
  accentHue: hueSchema.optional(),
  logoHue: hueSchema.nullable().optional(),
  headingFont: z.enum(FONT_CHOICE).optional(),
  bodyFont: z.enum(FONT_CHOICE).optional(),
  radiusScale: z.enum(RADIUS_SCALE).optional(),
  density: z.enum(DENSITY).optional(),
  languageSwitcherStyle: z.enum(LANGUAGE_SWITCHER_STYLE).optional(),
  cardStyle: z.enum(CARD_STYLE).optional(),
  headerControlStyle: z.enum(HEADER_CONTROL_STYLE).optional(),
  accountButtonStyle: z.enum(ACCOUNT_BUTTON_STYLE).optional(),
  accountPanelStyle: z.enum(ACCOUNT_PANEL_STYLE).optional(),
  accountPhonePlacement: z.enum(ACCOUNT_PHONE_PLACEMENT).optional(),
  busyButtonStyle: z.enum(BUSY_BUTTON_STYLE).optional(),
  spinnerStyle: z.enum(SPINNER_STYLE).optional(),
  headerLayout: z.enum(HEADER_LAYOUT).optional(),
  headerSubmenuStyle: z.enum(HEADER_SUBMENU_STYLE).optional(),
  headerBarStyle: z.enum(HEADER_BAR_STYLE).optional(),
  footerLayout: z.enum(FOOTER_LAYOUT).optional(),
  footerBackground: z.enum(BRAND_VARIANT).optional(),
  footerSurface: z.enum(FOOTER_SURFACE).optional(),
  cookieSettingsButton: z.enum(COOKIE_SETTINGS_BUTTON).optional(),
  logoAssetUrl: z.string().trim().url().nullable().optional(),
  faviconAssetUrl: z.string().trim().url().nullable().optional(),
});

export type TUpdateSiteConfigInput = z.input<
  typeof updateSiteConfigInputSchema
> & {
  voiceOverridesByLocale?: TVoiceOverridesByLocaleInput;
};

type TSiteConfigWritable = Partial<typeof siteConfig.$inferInsert>;

// An `undefined` key is left out entirely, which keeps an omitted column out of both `INSERT` and `UPDATE ... SET`.
export function presentOptionalFields(
  parsed: z.output<typeof updateSiteConfigInputSchema>,
): TSiteConfigWritable {
  return Object.fromEntries(
    Object.entries(parsed).filter(
      ([field, value]) => field !== LOOK_FIELD.PRESET && !isUndefined(value),
    ),
  );
}
