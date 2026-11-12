import type { TMaybeNull } from '@blog/config';
import { getDb } from '@blog/db/client';
import type { TTenantStatus } from '@blog/db/constants';
import { isFreeOwnerViolation } from '@blog/db/queries/tenants/is-free-owner-violation';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

import { tenantDetailsWrite } from './tenant-details-fields';

type TTenantDetailsRowWrite = {
  details: Parameters<typeof tenantDetailsWrite>[0];
  status: TTenantStatus;
  clearsUnsentReinvite: boolean;
};

// Null when the write would give the owner a second Free-or-trial site.
export async function writeTenantDetailsRow(
  tenantId: string,
  { details, status, clearsUnsentReinvite }: TTenantDetailsRowWrite,
): Promise<TMaybeNull<TTenant>> {
  try {
    const [tenant] = await getDb()
      .update(tenants)
      .set(tenantDetailsWrite(details, status, clearsUnsentReinvite))
      .where(eq(tenants.id, tenantId))
      .returning();

    if (!tenant) {
      throw new Error(
        `updateTenantDetails: update for tenant "${tenantId}" returned no row.`,
      );
    }

    return tenant;
  } catch (error) {
    if (isFreeOwnerViolation(error)) return null;
    throw error;
  }
}
