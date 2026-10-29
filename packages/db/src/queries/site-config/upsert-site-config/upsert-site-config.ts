import type { TVoiceFieldFailuresByLocale } from '@blog/config';
import { PRESET_REGISTRY, type TLocaleIsoCode } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
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
import { isUndefined } from '@blog/utils/primitives';
import { eq, sql } from 'drizzle-orm';

import {
  assertKnownLocales,
  parseVoiceOverridesByLocale,
} from './parse-voice-overrides';
import {
  presentOptionalFields,
  type TUpdateSiteConfigInput,
  updateSiteConfigInputSchema,
} from './site-config-input';

export type {
  TVoiceOverridesByLocaleInput,
  TVoiceOverridesInput,
} from './parse-voice-overrides';
export {
  type TUpdateSiteConfigInput,
  updateSiteConfigInputSchema,
} from './site-config-input';

export type TUpsertSiteConfigResult = TResult<
  TSiteConfigResult,
  TVoiceFieldFailuresByLocale
>;

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

  let voicePatch: TMaybeUndefined<TVoiceOverridesByLocale>;
  if (!isUndefined(voiceOverridesByLocale)) {
    assertKnownLocales(voiceOverridesByLocale);
    const result = parseVoiceOverridesByLocale(voiceOverridesByLocale);
    if (!result.ok) return result;
    voicePatch = result.data;
  }

  const { preset } = parsed;
  const optional = presentOptionalFields(parsed);
  const presetBundle = PRESET_REGISTRY[preset];
  const { accentHue, headingFont, bodyFont, radiusScale, density } =
    presetBundle.themeTokens;

  const [row] = await db
    .insert(siteConfig)
    .values({
      tenantId,
      accentHue,
      headingFont,
      bodyFont,
      radiusScale,
      density,
      cardStyle: presetBundle.cardStyle,
      headerControlStyle: presetBundle.headerControlStyle,
      accountButtonStyle: presetBundle.accountButtonStyle,
      accountPanelStyle: presetBundle.accountPanelStyle,
      accountPhonePlacement: presetBundle.accountPhonePlacement,
      busyButtonStyle: presetBundle.busyButtonStyle,
      spinnerStyle: presetBundle.spinnerStyle,
      headerLayout: presetBundle.headerLayout,
      headerSubmenuStyle: presetBundle.headerSubmenuStyle,
      headerBarStyle: presetBundle.headerBarStyle,
      footerLayout: presetBundle.footerLayout,
      footerBackground: presetBundle.footerBackground,
      footerSurface: presetBundle.footerSurface,
      cookieSettingsButton: presetBundle.cookieSettingsButton,
      preset,
      ...optional,
      ...(voicePatch && { voiceOverridesByLocale: voicePatch }),
    })
    .onConflictDoUpdate({
      target: siteConfig.tenantId,
      set: {
        preset,
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
