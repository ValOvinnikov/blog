import { getDb } from '@blog/db/client';
import { settingsFeatures } from '@blog/db/schema/settings-features';

import type { TSettingsFeaturesResult } from '../get-settings-features';

// A field absent from the input is left untouched on `UPDATE` (and falls
// back to the column's own Postgres default on the first `INSERT` for a
// tenant) — each capability toggle saves independently, so one save must
// never flip a toggle the caller didn't touch.
export type TUpdateSettingsFeaturesInput = {
  commentsEnabled?: boolean;
  ratingsEnabled?: boolean;
  bookmarksEnabled?: boolean;
  newsletterEnabled?: boolean;
  analyticsEnabled?: boolean;
};

type TSettingsFeaturesWritable = Partial<typeof settingsFeatures.$inferInsert>;

function presentFields(
  input: TUpdateSettingsFeaturesInput,
): TSettingsFeaturesWritable {
  const fields: TSettingsFeaturesWritable = {};

  if (input.commentsEnabled !== undefined) {
    fields.commentsEnabled = input.commentsEnabled;
  }
  if (input.ratingsEnabled !== undefined) {
    fields.ratingsEnabled = input.ratingsEnabled;
  }
  if (input.bookmarksEnabled !== undefined) {
    fields.bookmarksEnabled = input.bookmarksEnabled;
  }
  if (input.newsletterEnabled !== undefined) {
    fields.newsletterEnabled = input.newsletterEnabled;
  }
  if (input.analyticsEnabled !== undefined) {
    fields.analyticsEnabled = input.analyticsEnabled;
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
