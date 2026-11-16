import { getDb } from '@shinefold/db/client';
import {
  settingsFeatures,
  type TSettingsFeatures,
} from '@shinefold/db/schema/settings-features';
import { eq } from 'drizzle-orm';

export type TSettingsFeaturesResult = TSettingsFeatures;

export async function getSettingsFeatures(
  tenantId: string,
): Promise<TSettingsFeaturesResult | undefined> {
  const db = getDb();

  const [row] = await db
    .select()
    .from(settingsFeatures)
    .where(eq(settingsFeatures.tenantId, tenantId));

  return row;
}
