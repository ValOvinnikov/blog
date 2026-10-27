import type { TVoiceFieldFailuresByLocale } from '@blog/config';
import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  CARD_STYLE,
  DENSITY,
  LANGUAGE_SWITCHER_STYLE,
  FONT_CHOICE,
  HEADER_CONTROL_STYLE,
  HUE_MAX,
  HUE_MIN,
  PRESET_ID,
  PRESET_REGISTRY,
  RADIUS_SCALE,
  type TAccountButtonStyle,
  type TAccountPanelStyle,
  type TAccountPhonePlacement,
  type TCardStyle,
  type TDensity,
  type THeaderControlStyle,
  type TLanguageSwitcherStyle,
  type TFontChoice,
  type TLocaleIsoCode,
  type TPresetId,
  type TRadiusScale,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  toSiteConfigResult,
  type TSiteConfigResult,
} from '@blog/db/queries/site-config/get-site-config';
import {
  siteConfig,
  type TVoiceOverridesByLocale,
} from '@blog/db/schema/site-config';
import { tenants } from '@blog/db/schema/tenants';
import { okResult, type TResult } from '@blog/utils';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import {
  assertKnownLocales,
  parseVoiceOverridesByLocale,
  type TVoiceOverridesByLocaleInput,
} from './parse-voice-overrides';

export type {
  TVoiceOverridesByLocaleInput,
  TVoiceOverridesInput,
} from './parse-voice-overrides';

const hueSchema = z.number().int().min(HUE_MIN).max(HUE_MAX);

export type TUpsertSiteConfigResult = TResult<
  TSiteConfigResult,
  TVoiceFieldFailuresByLocale
>;

// A field absent from the input is left untouched on `UPDATE` — Look and
// Voice are saved from separate admin-panel tabs, so a Look save must never
// wipe Voice data (or vice versa). `logoHue`/`logoAssetUrl`/`faviconAssetUrl`
// additionally accept an explicit `null` to clear them, since `undefined`
// alone can't express "unset this". A Voice save replaces the map of each
// locale it carries (even with `{}`) and leaves every other locale's map untouched.
export const updateSiteConfigInputSchema = z.object({
  preset: z.enum(Object.values(PRESET_ID) as [TPresetId, ...TPresetId[]]),
  accentHue: hueSchema,
  logoHue: hueSchema.nullable().optional(),
  headingFont: z.enum(
    Object.values(FONT_CHOICE) as [TFontChoice, ...TFontChoice[]],
  ),
  bodyFont: z.enum(
    Object.values(FONT_CHOICE) as [TFontChoice, ...TFontChoice[]],
  ),
  radiusScale: z.enum(
    Object.values(RADIUS_SCALE) as [TRadiusScale, ...TRadiusScale[]],
  ),
  density: z.enum(Object.values(DENSITY) as [TDensity, ...TDensity[]]),
  languageSwitcherStyle: z
    .enum(
      Object.values(LANGUAGE_SWITCHER_STYLE) as [
        TLanguageSwitcherStyle,
        ...TLanguageSwitcherStyle[],
      ],
    )
    .optional(),
  cardStyle: z
    .enum(Object.values(CARD_STYLE) as [TCardStyle, ...TCardStyle[]])
    .optional(),
  headerControlStyle: z
    .enum(
      Object.values(HEADER_CONTROL_STYLE) as [
        THeaderControlStyle,
        ...THeaderControlStyle[],
      ],
    )
    .optional(),
  accountButtonStyle: z
    .enum(
      Object.values(ACCOUNT_BUTTON_STYLE) as [
        TAccountButtonStyle,
        ...TAccountButtonStyle[],
      ],
    )
    .optional(),
  accountPanelStyle: z
    .enum(
      Object.values(ACCOUNT_PANEL_STYLE) as [
        TAccountPanelStyle,
        ...TAccountPanelStyle[],
      ],
    )
    .optional(),
  accountPhonePlacement: z
    .enum(
      Object.values(ACCOUNT_PHONE_PLACEMENT) as [
        TAccountPhonePlacement,
        ...TAccountPhonePlacement[],
      ],
    )
    .optional(),
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
function presentOptionalFields(
  parsed: z.output<typeof updateSiteConfigInputSchema>,
): TSiteConfigWritable {
  const fields: TSiteConfigWritable = {};

  if (parsed.logoHue !== undefined) fields.logoHue = parsed.logoHue;
  if (parsed.languageSwitcherStyle !== undefined) {
    fields.languageSwitcherStyle = parsed.languageSwitcherStyle;
  }
  if (parsed.cardStyle !== undefined) fields.cardStyle = parsed.cardStyle;
  if (parsed.headerControlStyle !== undefined) {
    fields.headerControlStyle = parsed.headerControlStyle;
  }
  if (parsed.accountButtonStyle !== undefined) {
    fields.accountButtonStyle = parsed.accountButtonStyle;
  }
  if (parsed.accountPanelStyle !== undefined) {
    fields.accountPanelStyle = parsed.accountPanelStyle;
  }
  if (parsed.accountPhonePlacement !== undefined) {
    fields.accountPhonePlacement = parsed.accountPhonePlacement;
  }
  if (parsed.logoAssetUrl !== undefined) {
    fields.logoAssetUrl = parsed.logoAssetUrl;
  }
  if (parsed.faviconAssetUrl !== undefined) {
    fields.faviconAssetUrl = parsed.faviconAssetUrl;
  }

  return fields;
}

async function getTenantLocale(tenantId: string): Promise<TLocaleIsoCode> {
  const [tenant] = await getDb()
    .select({ locale: tenants.locale })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (!tenant) {
    throw new Error(`upsertSiteConfig: no tenant "${tenantId}".`);
  }

  return tenant.locale;
}

export async function upsertSiteConfig(
  tenantId: string,
  input: TUpdateSiteConfigInput,
): Promise<TUpsertSiteConfigResult> {
  const db = getDb();
  const { voiceOverridesByLocale, ...rest } = input;
  const parsed = updateSiteConfigInputSchema.parse(rest);
  const defaultLocale = await getTenantLocale(tenantId);

  let voicePatch: TVoiceOverridesByLocale | undefined;
  if (voiceOverridesByLocale !== undefined) {
    assertKnownLocales(voiceOverridesByLocale);
    const result = parseVoiceOverridesByLocale(voiceOverridesByLocale);
    if (!result.ok) return result;
    voicePatch = result.data;
  }

  const required = {
    preset: parsed.preset,
    accentHue: parsed.accentHue,
    headingFont: parsed.headingFont,
    bodyFont: parsed.bodyFont,
    radiusScale: parsed.radiusScale,
    density: parsed.density,
  };
  const optional = presentOptionalFields(parsed);
  const presetBundle = PRESET_REGISTRY[parsed.preset];

  const [row] = await db
    .insert(siteConfig)
    .values({
      tenantId,
      cardStyle: presetBundle.cardStyle,
      headerControlStyle: presetBundle.headerControlStyle,
      accountButtonStyle: presetBundle.accountButtonStyle,
      accountPanelStyle: presetBundle.accountPanelStyle,
      accountPhonePlacement: presetBundle.accountPhonePlacement,
      ...required,
      ...optional,
      ...(voicePatch && { voiceOverridesByLocale: voicePatch }),
    })
    .onConflictDoUpdate({
      target: siteConfig.tenantId,
      set: {
        ...required,
        ...optional,
        ...(voicePatch && {
          voiceOverridesByLocale: sql`${siteConfig.voiceOverridesByLocale} || ${JSON.stringify(voicePatch)}::jsonb`,
        }),
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!row) {
    throw new Error(
      `upsertSiteConfig: upsert for tenant "${tenantId}" returned no row.`,
    );
  }

  return okResult(toSiteConfigResult(row, defaultLocale));
}
