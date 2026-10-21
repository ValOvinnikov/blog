import {
  TENANT_OWNER_EMAIL,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import { sanitizeLogMessage } from '@blog/insight';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { logger } from '@worker/utils/logger/logger';
import { grantOwnerAdministrator } from '@worker/utils/owner-access/grant-owner-administrator';
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

async function resolveOwnerAccess(
  target: TOwnerAccessTarget,
): Promise<TElevateTenantOwnerOutcome> {
  const { tenant } = target;
  const owner = await findOwner(target);
  if (owner) {
    const outcome = await grantOwnerAdministrator(target, owner);
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
): Promise<TElevateTenantOwnerOutcome> {
  'use step';

  const target = await loadOwnerAccessTarget(tenantId);
  let outcome: TElevateTenantOwnerOutcome;
  try {
    outcome = await resolveOwnerAccess(target);
  } catch (error) {
    if (!isFinalStepAttempt(error)) throw error;
    logger.error('owner_access.check_failed', {
      tenantId,
      error: sanitizeLogMessage(error),
    });
    outcome = pendingOwnerAccessOutcome(target.tenant);
  }

  await reportOwnerAccessOutcome(target.tenant, outcome);
  return outcome;
}

checkOwnerAccess.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
