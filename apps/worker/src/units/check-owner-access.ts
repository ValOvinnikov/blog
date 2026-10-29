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
  recordOwnerAccessFailure,
  resolveOwnerAccessFinding,
} from '@worker/utils/owner-access/owner-access-finding';
import {
  findOwner,
  loadOwnerAccessTarget,
  type TOwnerAccessTarget,
} from '@worker/utils/owner-access/owner-access-target';
import { sendOwnerInvite } from '@worker/utils/owner-access/owner-invite';
import {
  ownerAccessFailingSince,
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
  hasFailed: boolean;
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
): Promise<TOwnerAccessCheck> {
  'use step';

  const target = await loadOwnerAccessTarget(tenantId);
  const { tenant } = target;
  let outcome: TElevateTenantOwnerOutcome;
  try {
    outcome = await resolveOwnerAccess(target);
  } catch (error) {
    if (!isFinalStepAttempt(error)) throw error;
    const message = sanitizeLogMessage(error);
    logger.error(OWNER_ACCESS_LOG.CHECK_FAILED, { tenantId, error: message });
    const failingSince = ownerAccessFailingSince(tenant) ?? new Date();
    await recordOwnerAccessFailure(tenant, message, failingSince);
    outcome = pendingOwnerAccessOutcome(tenant);
    await reportOwnerAccessOutcome(tenant, outcome, failingSince);
    return { outcome, hasFailed: true };
  }

  await reportOwnerAccessOutcome(tenant, outcome);
  return { outcome, hasFailed: false };
}

checkOwnerAccess.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
