import type { TMaybeNull } from '@blog/config/types';
import {
  TENANT_OWNER_EMAIL,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import { sanitizeLogMessage } from '@blog/insight';
import { OWNER_ACCESS_LOG } from '@worker/constants/owner-access';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { logger } from '@worker/utils/logger/logger';
import { grantOwnerAdministrator } from '@worker/utils/owner-access/grant-owner-administrator';
import {
  openOwnerAccessFindingOnceOverdue,
  resolveOwnerAccessFinding,
} from '@worker/utils/owner-access/owner-access-finding';
import {
  findOwner,
  loadOwnerAccessTarget,
  type TOwnerAccessTarget,
} from '@worker/utils/owner-access/owner-access-target';
import { sendOwnerInvite } from '@worker/utils/owner-access/owner-invite';
import {
  pendingOwnerAccessOutcome,
  reportOwnerAccessOutcome,
} from '@worker/utils/owner-access/report-owner-access-outcome';
import {
  sendOwnerEmailOnce,
  sendPendingOwnerEmails,
} from '@worker/utils/owner-email/send-owner-email';

import { isFinalStepAttempt } from './run-reported-step';

export type TOwnerAccessCheck = {
  outcome: TElevateTenantOwnerOutcome;
  failingSince: TMaybeNull<number>;
};

async function resolveOwnerAccess(
  target: TOwnerAccessTarget,
): Promise<TElevateTenantOwnerOutcome> {
  const { tenant } = target;
  const owner = await findOwner(target);
  if (owner) {
    const outcome = await grantOwnerAdministrator(target, owner);
    await resolveOwnerAccessFinding(tenant.id);
    await sendOwnerEmailOnce(target, TENANT_OWNER_EMAIL.SITE_READY);
    return outcome;
  }
  if (tenant.ownerInviteSentAt) {
    await sendPendingOwnerEmails(target);
    return pendingOwnerAccessOutcome(tenant);
  }

  const ownerInviteSentAt = await sendOwnerInvite(target, {
    replaceExisting: false,
  });
  return pendingOwnerAccessOutcome({ ...tenant, ownerInviteSentAt });
}

export async function checkOwnerAccess(
  tenantId: string,
  failingSince: TMaybeNull<number> = null,
): Promise<TOwnerAccessCheck> {
  'use step';

  const target = await loadOwnerAccessTarget(tenantId);
  let check: TOwnerAccessCheck;
  try {
    const outcome = await resolveOwnerAccess(target);
    check = { outcome, failingSince: null };
  } catch (error) {
    if (!isFinalStepAttempt(error)) throw error;
    const message = sanitizeLogMessage(error);
    logger.error(OWNER_ACCESS_LOG.CHECK_FAILED, { tenantId, error: message });
    const since = failingSince ?? Date.now();
    await openOwnerAccessFindingOnceOverdue(tenantId, since, message);
    check = {
      outcome: pendingOwnerAccessOutcome(target.tenant),
      failingSince: since,
    };
  }

  await reportOwnerAccessOutcome(target.tenant, check.outcome);
  return check;
}

checkOwnerAccess.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
