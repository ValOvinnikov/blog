import 'server-only';

import { TENANT_LOG } from '@platform/constants/tenant';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { setSubscriptionCollectionPaused } from '@platform/server/billing/tenant-subscription-lifecycle';
import { notifyOwnerOfSuspension } from '@platform/server/tenants/notify-owner-of-suspension';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TAuditAction,
  type TMaybeUndefined,
  type TOutcome,
} from '@shinefold/config';
import { TENANT_STATUS, type TSuspensionStatus } from '@shinefold/db';
import type { TTenantSuspension } from '@shinefold/db/schema/tenant-suspensions';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { after } from 'next/server';

const SUSPENSION_AUDIT_ACTION = {
  [TENANT_STATUS.SUSPENDED]: AUDIT_ACTION.SUSPENSION_APPLIED,
  [TENANT_STATUS.ACTIVE]: AUDIT_ACTION.SUSPENSION_LIFTED,
} as const satisfies Record<TSuspensionStatus, TAuditAction>;

export const completeSuspensionChange = async (
  tenant: TTenant,
  status: TSuspensionStatus,
  suspension: TMaybeUndefined<TTenantSuspension>,
): Promise<TOutcome<typeof ACTION_OUTCOME.SUCCESS>> => {
  await setSubscriptionCollectionPaused(
    tenant,
    status === TENANT_STATUS.SUSPENDED,
  );
  await recordAuditEvent({
    logEvent: TENANT_LOG.SUSPENSION_AUDIT_FAILED,
    action: SUSPENSION_AUDIT_ACTION[status],
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenant.id,
    details: {
      name: tenant.name,
      ...(suspension && {
        reference: suspension.reference,
        category: suspension.category,
      }),
    },
  });

  if (suspension) {
    after(() => notifyOwnerOfSuspension(tenant, suspension, status));
  }

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
