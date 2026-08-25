import {
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
  type TDensity,
  type TFontChoice,
  type TPresetId,
  type TRadiusScale,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { siteConfig } from '@blog/db/schema/site-config';
import { z } from 'zod';

import { toSiteConfigResult, type TSiteConfigResult } from '../get-site-config';

const HUE_MIN = 0;
const HUE_MAX = 360;

// Caps sized to each field's role, not one flat limit for all 20 — a prompt
// command reads nothing like a 404 description.
const SHORT_LABEL_MAX = 100;
const TOAST_MESSAGE_MAX = 150;
const LONG_COPY_MAX = 300;

const hueSchema = z.number().int().min(HUE_MIN).max(HUE_MAX);

// An override field is "clear this, fall back to the preset default" when
// submitted blank — never a stored empty string. Trimming happens before the
// blank check so whitespace-only input clears too.
function overrideField(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (!value ? undefined : value));
}

export const voiceOverridesSchema = z
  .object({
    notFoundMetaTitle: overrideField(SHORT_LABEL_MAX),
    notFoundMetaDescription: overrideField(LONG_COPY_MAX),
    notFoundCommandNotFound: overrideField(SHORT_LABEL_MAX),
    notFoundDescription: overrideField(LONG_COPY_MAX),
    notFoundReturnHome: overrideField(SHORT_LABEL_MAX),
    terminalPromptHost: overrideField(SHORT_LABEL_MAX),
    authPromptCommandSignIn: overrideField(SHORT_LABEL_MAX),
    authPromptCommandAccount: overrideField(SHORT_LABEL_MAX),
    bookmarksPromptCommand: overrideField(SHORT_LABEL_MAX),
    accountPrivacyPromptCommand: overrideField(SHORT_LABEL_MAX),
    accountNewsletterPromptCommand: overrideField(SHORT_LABEL_MAX),
    accountIdentityPromptCommand: overrideField(SHORT_LABEL_MAX),
    bookmarkToastSavedMessage: overrideField(TOAST_MESSAGE_MAX),
    bookmarkToastRemovedMessage: overrideField(TOAST_MESSAGE_MAX),
    blogListEmpty: overrideField(LONG_COPY_MAX),
    topicEmpty: overrideField(LONG_COPY_MAX),
    tagEmpty: overrideField(LONG_COPY_MAX),
    topicsEmpty: overrideField(LONG_COPY_MAX),
    bookmarksEmpty: overrideField(LONG_COPY_MAX),
  })
  .transform((overrides) => {
    const entries = Object.entries(overrides).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    );

    return Object.fromEntries(entries);
  });

// A field absent from the input is left untouched on `UPDATE` — Look and
// Voice are saved from separate admin-panel tabs, so a Look save must never
// wipe Voice data (or vice versa). `logoHue`/`logoAssetUrl`/`faviconAssetUrl`
// additionally accept an explicit `null` to actually clear them (distinct
// from omission) since `undefined` alone can't express "unset this" once a
// value has been set. `voiceOverrides` follows the same omit-vs-present
// rule one level up: omitted leaves the whole JSONB column untouched,
// present (even `{}`) replaces it — the per-field blank-clears-that-key
// behaviour inside it is unaffected either way.
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
  logoAssetUrl: z.string().trim().url().nullable().optional(),
  faviconAssetUrl: z.string().trim().url().nullable().optional(),
  voiceOverrides: voiceOverridesSchema.optional(),
});

// The pre-validation shape callers submit — a form's raw values, including
// blank strings for a cleared voice override. `updateSiteConfigInputSchema`
// turns this into the shape actually written to the row.
export type TUpdateSiteConfigInput = z.input<
  typeof updateSiteConfigInputSchema
>;

type TSiteConfigWritable = Partial<typeof siteConfig.$inferInsert>;

// Builds only the columns this call actually supplied — `undefined` means
// "key absent from the input", so it's excluded from the object entirely
// rather than passed through, which is what keeps an omitted column out of
// both the `INSERT` values and the `UPDATE ... SET` clause.
function presentOptionalFields(
  parsed: z.output<typeof updateSiteConfigInputSchema>,
): TSiteConfigWritable {
  const fields: TSiteConfigWritable = {};

  if (parsed.logoHue !== undefined) fields.logoHue = parsed.logoHue;
  if (parsed.logoAssetUrl !== undefined) {
    fields.logoAssetUrl = parsed.logoAssetUrl;
  }
  if (parsed.faviconAssetUrl !== undefined) {
    fields.faviconAssetUrl = parsed.faviconAssetUrl;
  }
  if (parsed.voiceOverrides !== undefined) {
    fields.voiceOverrides = parsed.voiceOverrides;
  }

  return fields;
}

export async function upsertSiteConfig(
  tenantId: string,
  input: TUpdateSiteConfigInput,
): Promise<TSiteConfigResult> {
  const db = getDb();
  const parsed = updateSiteConfigInputSchema.parse(input);

  const required = {
    preset: parsed.preset,
    accentHue: parsed.accentHue,
    headingFont: parsed.headingFont,
    bodyFont: parsed.bodyFont,
    radiusScale: parsed.radiusScale,
    density: parsed.density,
  };
  const optional = presentOptionalFields(parsed);

  const [row] = await db
    .insert(siteConfig)
    .values({ tenantId, ...required, ...optional })
    .onConflictDoUpdate({
      target: siteConfig.tenantId,
      set: { ...required, ...optional, updatedAt: new Date() },
    })
    .returning();

  if (!row) {
    throw new Error(
      `upsertSiteConfig: upsert for tenant "${tenantId}" returned no row.`,
    );
  }

  return toSiteConfigResult(row);
}
