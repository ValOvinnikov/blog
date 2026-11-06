import { getDb } from '@blog/db/client';
import { settingsFeatures } from '@blog/db/schema/settings-features';
import { isUndefined } from '@blog/utils/primitives';

import type { TSettingsFeaturesResult } from '../get-settings-features';

// A field absent from the input is left untouched on `UPDATE` (and falls
// back to the column's own Postgres default on the first `INSERT` for a
// tenant) — each capability toggle saves independently, so one save must
// never flip a toggle the caller didn't touch.
export type TUpdateSettingsFeaturesInput = {
  readerAccountsEnabled?: boolean;
  commentsEnabled?: boolean;
  ratingsEnabled?: boolean;
  bookmarksEnabled?: boolean;
  newsletterEnabled?: boolean;
  analyticsEnabled?: boolean;
  consentBannerEnabled?: boolean;
  contactFormEnabled?: boolean;
};

type TSettingsFeaturesWritable = Partial<typeof settingsFeatures.$inferInsert>;

function presentFields(
  input: TUpdateSettingsFeaturesInput,
): TSettingsFeaturesWritable {
  const fields: TSettingsFeaturesWritable = {};

  if (!isUndefined(input.readerAccountsEnabled)) {
    fields.readerAccountsEnabled = input.readerAccountsEnabled;
  }
  if (!isUndefined(input.commentsEnabled)) {
    fields.commentsEnabled = input.commentsEnabled;
  }
  if (!isUndefined(input.ratingsEnabled)) {
    fields.ratingsEnabled = input.ratingsEnabled;
  }
  if (!isUndefined(input.bookmarksEnabled)) {
    fields.bookmarksEnabled = input.bookmarksEnabled;
  }
  if (!isUndefined(input.newsletterEnabled)) {
    fields.newsletterEnabled = input.newsletterEnabled;
  }
  if (!isUndefined(input.analyticsEnabled)) {
    fields.analyticsEnabled = input.analyticsEnabled;
  }
  if (!isUndefined(input.consentBannerEnabled)) {
    fields.consentBannerEnabled = input.consentBannerEnabled;
  }
  if (!isUndefined(input.contactFormEnabled)) {
    fields.contactFormEnabled = input.contactFormEnabled;
  }

  return fields;
}

export async function upsertSettingsFeatures(
  tenantId: string,
  input: TUpdateSettingsFeaturesInput,
): Promise<TSettingsFeaturesResult> {
  const db = getDb();
  const fields = presentFields(input);

  const [row] = await db
    .insert(settingsFeatures)
    .values({ tenantId, ...fields })
    .onConflictDoUpdate({
      target: settingsFeatures.tenantId,
      set: { ...fields, updatedAt: new Date() },
    })
    .returning();

  if (!row) {
    throw new Error(
      `upsertSettingsFeatures: upsert for tenant "${tenantId}" returned no row.`,
    );
  }

  return row;
}
