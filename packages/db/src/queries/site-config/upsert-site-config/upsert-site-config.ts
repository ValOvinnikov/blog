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
    categoryEmpty: overrideField(LONG_COPY_MAX),
    tagEmpty: overrideField(LONG_COPY_MAX),
    authorEmpty: overrideField(LONG_COPY_MAX),
    topicsEmpty: overrideField(LONG_COPY_MAX),
    bookmarksEmpty: overrideField(LONG_COPY_MAX),
  })
  .transform((overrides) => {
    const entries = Object.entries(overrides).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    );

    return Object.fromEntries(entries);
  });

export const updateSiteConfigInputSchema = z.object({
  preset: z.enum(Object.values(PRESET_ID) as [TPresetId, ...TPresetId[]]),
  accentHue: hueSchema,
  logoHue: hueSchema.optional(),
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
  logoAssetUrl: z.string().trim().url().optional(),
  faviconAssetUrl: z.string().trim().url().optional(),
  voiceOverrides: voiceOverridesSchema.optional(),
});

// The pre-validation shape callers submit — a form's raw values, including
// blank strings for a cleared voice override. `updateSiteConfigInputSchema`
// turns this into the shape actually written to the row.
export type TUpdateSiteConfigInput = z.input<
  typeof updateSiteConfigInputSchema
>;

export async function upsertSiteConfig(
  tenantId: string,
  input: TUpdateSiteConfigInput,
): Promise<TSiteConfigResult> {
  const db = getDb();
  const { voiceOverrides, ...parsed } =
    updateSiteConfigInputSchema.parse(input);
  const values = { ...parsed, voiceOverrides: voiceOverrides ?? {} };

  const [row] = await db
    .insert(siteConfig)
    .values({ tenantId, ...values })
    .onConflictDoUpdate({
      target: siteConfig.tenantId,
      set: { ...values, updatedAt: new Date() },
    })
    .returning();

  if (!row) {
    throw new Error(
      `upsertSiteConfig: upsert for tenant "${tenantId}" returned no row.`,
    );
  }

  return toSiteConfigResult(row);
}
