import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { decryptPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { normalizeEmailIdentity } from '@blog/utils/normalize-email-identity';
import { inArray, isNotNull } from 'drizzle-orm';

export type TPersonalDataUnsentStudioReinvite = {
  tenantId: string;
  tenantName: string;
  email: string;
};

// The column has no lookup index, so every stored address is decrypted and compared.
export async function findUnsentStudioReinvites(
  email: string,
): Promise<TPersonalDataUnsentStudioReinvite[]> {
  const address = normalizeEmailIdentity(email);
  const rows = await getDb()
    .select({
      tenantId: tenants.id,
      tenantName: tenants.name,
      encrypted: tenants.unsentReinviteFormerOwnerEmailEncrypted,
    })
    .from(tenants)
    .where(isNotNull(tenants.unsentReinviteFormerOwnerEmailEncrypted));

  return rows.flatMap(({ tenantId, tenantName, encrypted }) => {
    if (!encrypted) return [];
    const storedEmail = decryptPersonalValue(encrypted);
    return normalizeEmailIdentity(storedEmail) === address
      ? [{ tenantId, tenantName, email: storedEmail }]
      : [];
  });
}

export async function eraseUnsentStudioReinvites(
  email: string,
): Promise<number> {
  const matches = await findUnsentStudioReinvites(email);
  if (matches.length === 0) return 0;

  await getDb()
    .update(tenants)
    .set({ unsentReinviteFormerOwnerEmailEncrypted: null })
    .where(
      inArray(
        tenants.id,
        matches.map(({ tenantId }) => tenantId),
      ),
    );
  return matches.length;
}
