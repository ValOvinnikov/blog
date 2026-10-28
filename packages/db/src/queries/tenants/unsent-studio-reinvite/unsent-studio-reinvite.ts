import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import {
  decryptPersonalValue,
  encryptPersonalValue,
} from '@blog/db/utils/personal-data/personal-data';
import { isNull } from '@blog/utils/primitives';
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

  const encrypted = row?.encrypted ?? null;
  return isNull(encrypted) ? null : decryptPersonalValue(encrypted);
}

export async function clearUnsentStudioReinvite(
  tenantId: string,
): Promise<void> {
  await getDb()
    .update(tenants)
    .set({ unsentReinviteFormerOwnerEmailEncrypted: null })
    .where(eq(tenants.id, tenantId));
}
