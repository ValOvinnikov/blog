import type { TOutcome } from '@shinefold/config';
import { getDb } from '@shinefold/db/client';
import {
  TENANT_DETAILS_UPDATE_OUTCOME,
  type TTenantStatus,
} from '@shinefold/db/constants';
import { unlockMembershipsWithinPlan } from '@shinefold/db/queries/memberships/memberships-over-seats';
import { isFreeOwnerViolation } from '@shinefold/db/queries/tenants/is-free-owner-violation';
import { memberships } from '@shinefold/db/schema/memberships';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';
import { hasLength } from '@shinefold/utils/primitives';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { eq, getTableColumns, inArray, sql } from 'drizzle-orm';

import {
  restorableTenantFields,
  tenantDetailsWrite,
} from './tenant-details-fields';

type TTenantDetailsRowWrite = {
  details: Parameters<typeof tenantDetailsWrite>[0];
  status: TTenantStatus;
  clearsUnsentReinvite: boolean;
};

export type TTenantDetailsRow = {
  tenant: TTenant;
  unlockedMembershipIds: string[];
};

export async function writeTenantDetailsRow(
  tenantId: string,
  { details, status, clearsUnsentReinvite }: TTenantDetailsRowWrite,
): Promise<
  | TTenantDetailsRow
  | TOutcome<typeof TENANT_DETAILS_UPDATE_OUTCOME.OWNS_FREE_TENANT>
> {
  try {
    const unlocked = unlockMembershipsWithinPlan(tenantId, details.plan);
    const [row] = await getDb()
      .with(unlocked)
      .update(tenants)
      .set(
        tenantDetailsWrite(details, status, clearsUnsentReinvite, new Date()),
      )
      .where(eq(tenants.id, tenantId))
      .returning({
        ...getTableColumns(tenants),
        unlockedMembershipIds: sql<
          string[]
        >`(select coalesce(array_agg(${unlocked.id}), '{}') from ${unlocked})`,
      });

    if (!row) {
      throw new Error(
        `writeTenantDetailsRow: update for tenant "${tenantId}" returned no row.`,
      );
    }

    const { unlockedMembershipIds, ...tenant } = row;
    return { tenant, unlockedMembershipIds };
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
  unlockedMembershipIds: string[],
): Promise<void> {
  const db = getDb();
  await db
    .update(tenants)
    .set(restorableTenantFields(original))
    .where(eq(tenants.id, tenantId));
  if (hasLength(unlockedMembershipIds)) {
    await db
      .update(memberships)
      .set({ lockedAt: new Date() })
      .where(inArray(memberships.id, unlockedMembershipIds));
  }
}
