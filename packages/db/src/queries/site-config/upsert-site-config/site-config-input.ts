import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  BUSY_BUTTON_STYLE,
  CARD_STYLE,
  DENSITY,
  LANGUAGE_SWITCHER_STYLE,
  FONT_CHOICE,
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
import type { siteConfig } from '@blog/db/schema/site-config';
import { isUndefined } from '@blog/utils/primitives';
import { z } from 'zod';

import type { TVoiceOverridesByLocaleInput } from './parse-voice-overrides';

const hueSchema = z.number().int().min(HUE_MIN).max(HUE_MAX);

// A field absent from the input is left untouched on `UPDATE` — Look and
// Voice are saved from separate admin-panel tabs, so a Look save must never
// wipe Voice data (or vice versa). `logoHue`/`logoAssetUrl`/`faviconAssetUrl`
// additionally accept an explicit `null` to clear them, since `undefined`
// alone can't express "unset this". A Voice save replaces the map of each
// locale it carries (even with `{}`) and leaves every other locale's map untouched.
export const updateSiteConfigInputSchema = z.object({
  preset: z.enum(PRESET_ID),
  accentHue: hueSchema,
  logoHue: hueSchema.nullable().optional(),
  headingFont: z.enum(FONT_CHOICE),
  bodyFont: z.enum(FONT_CHOICE),
  radiusScale: z.enum(RADIUS_SCALE),
  density: z.enum(DENSITY),
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
  const fields: TSiteConfigWritable = {};

  if (!isUndefined(parsed.logoHue)) fields.logoHue = parsed.logoHue;
  if (!isUndefined(parsed.languageSwitcherStyle)) {
    fields.languageSwitcherStyle = parsed.languageSwitcherStyle;
  }
  if (!isUndefined(parsed.cardStyle)) fields.cardStyle = parsed.cardStyle;
  if (!isUndefined(parsed.headerControlStyle)) {
    fields.headerControlStyle = parsed.headerControlStyle;
  }
  if (!isUndefined(parsed.accountButtonStyle)) {
    fields.accountButtonStyle = parsed.accountButtonStyle;
  }
  if (!isUndefined(parsed.accountPanelStyle)) {
    fields.accountPanelStyle = parsed.accountPanelStyle;
  }
  if (!isUndefined(parsed.accountPhonePlacement)) {
    fields.accountPhonePlacement = parsed.accountPhonePlacement;
  }
  if (!isUndefined(parsed.busyButtonStyle)) {
    fields.busyButtonStyle = parsed.busyButtonStyle;
  }
  if (!isUndefined(parsed.spinnerStyle)) {
    fields.spinnerStyle = parsed.spinnerStyle;
  }
  if (!isUndefined(parsed.headerLayout)) {
    fields.headerLayout = parsed.headerLayout;
  }
  if (!isUndefined(parsed.headerSubmenuStyle)) {
    fields.headerSubmenuStyle = parsed.headerSubmenuStyle;
  }
  if (!isUndefined(parsed.headerBarStyle)) {
    fields.headerBarStyle = parsed.headerBarStyle;
  }
  if (!isUndefined(parsed.logoAssetUrl)) {
    fields.logoAssetUrl = parsed.logoAssetUrl;
  }
  if (!isUndefined(parsed.faviconAssetUrl)) {
    fields.faviconAssetUrl = parsed.faviconAssetUrl;
  }

  return fields;
}
