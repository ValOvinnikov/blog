import type { TOutcome } from '@blog/config';
import { getDb } from '@blog/db/client';
import {
  TENANT_DETAILS_UPDATE_OUTCOME,
  type TTenantStatus,
} from '@blog/db/constants';
import { lockMembershipsOverSeats } from '@blog/db/queries/memberships/lock-memberships-over-seats';
import { unlockMembershipsWithinPlan } from '@blog/db/queries/memberships/memberships-over-seats';
import { isFreeOwnerViolation } from '@blog/db/queries/tenants/is-free-owner-violation';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { toOutcome } from '@blog/utils/to-outcome';
import { eq } from 'drizzle-orm';

import {
  restorableTenantFields,
  tenantDetailsWrite,
} from './tenant-details-fields';

type TTenantDetailsRowWrite = {
  details: Parameters<typeof tenantDetailsWrite>[0];
  status: TTenantStatus;
  clearsUnsentReinvite: boolean;
};

export async function writeTenantDetailsRow(
  tenantId: string,
  { details, status, clearsUnsentReinvite }: TTenantDetailsRowWrite,
): Promise<
  TTenant | TOutcome<typeof TENANT_DETAILS_UPDATE_OUTCOME.OWNS_FREE_TENANT>
> {
  try {
    const unlocked = unlockMembershipsWithinPlan(tenantId, details.plan);
    const [tenant] = await getDb()
      .with(unlocked)
      .update(tenants)
      .set(
        tenantDetailsWrite(details, status, clearsUnsentReinvite, new Date()),
      )
      .where(eq(tenants.id, tenantId))
      .returning();

    if (!tenant) {
      throw new Error(
        `writeTenantDetailsRow: update for tenant "${tenantId}" returned no row.`,
      );
    }

    return tenant;
  } catch (error) {
    if (isFreeOwnerViolation(error)) {
      return toOutcome(TENANT_DETAILS_UPDATE_OUTCOME.OWNS_FREE_TENANT);
    }
    throw error;
  }
}

export async function restoreTenantDetailsRow(
  tenantId: string,
  original: TTenant,
): Promise<void> {
  await getDb()
    .update(tenants)
    .set(restorableTenantFields(original))
    .where(eq(tenants.id, tenantId));
  await lockMembershipsOverSeats(tenantId, original.plan, new Date());
}
