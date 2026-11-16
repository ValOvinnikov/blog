import type { TMaybeNull } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import {
  decryptOptionalPersonalValue,
  encryptPersonalValue,
} from '@shinefold/db/utils/personal-data/personal-data';
import { eq } from 'drizzle-orm';

export async function setUnsentStudioReinvite(
  tenantId: string,
  formerOwnerEmail: string,
): Promise<void> {
  await getDb()
    .update(tenants)
    .set({
      unsentReinviteFormerOwnerEmailEncrypted:
        encryptPersonalValue(formerOwnerEmail),
    })
    .where(eq(tenants.id, tenantId));
}

export async function getUnsentStudioReinviteEmail(
  tenantId: string,
): Promise<TMaybeNull<string>> {
  const [row] = await getDb()
    .select({ encrypted: tenants.unsentReinviteFormerOwnerEmailEncrypted })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  return decryptOptionalPersonalValue(row?.encrypted ?? null);
}

export async function clearUnsentStudioReinvite(
  tenantId: string,
): Promise<void> {
  await getDb()
    .update(tenants)
    .set({ unsentReinviteFormerOwnerEmailEncrypted: null })
    .where(eq(tenants.id, tenantId));
}
