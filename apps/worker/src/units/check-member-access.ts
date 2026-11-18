import type { TMaybeNull } from '@shinefold/config/types';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  type TElevateTenantOwnerOutcome,
} from '@shinefold/db/constants';
import { hasStudioInviteStalled } from '@shinefold/db/utils/studio-access/studio-access';
import { sanitizeLogMessage } from '@shinefold/insight';
import { MEMBER_ACCESS_LOG } from '@worker/constants/member-access';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import type { TAccessCheck } from '@worker/utils/access-run/poll-access';
import { logger } from '@worker/utils/logger/logger';
import { grantMemberAdministrator } from '@worker/utils/member-access/grant-member-administrator';
import {
  loadMemberAccessTarget,
  type TMemberAccessTarget,
} from '@worker/utils/member-access/member-access-target';
import { sendMemberInvite } from '@worker/utils/member-access/member-invite';
import { findStudioUser } from '@worker/utils/studio-access/find-studio-user';

import { isFinalStepAttempt } from './run-reported-step';

function pendingMemberAccessOutcome(
  inviteSentAt: TMaybeNull<Date>,
): TMaybeNull<TElevateTenantOwnerOutcome> {
  if (!inviteSentAt) return null;
  return hasStudioInviteStalled(inviteSentAt, new Date())
    ? ELEVATE_TENANT_OWNER_OUTCOME.STALLED
    : ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE;
}

async function resolveMemberAccess(
  target: TMemberAccessTarget,
): Promise<TMaybeNull<TElevateTenantOwnerOutcome>> {
  const user = await findStudioUser(target, target.email);
  if (user) return grantMemberAdministrator(target, user);

  const { inviteSentAt } = target.access;
  return pendingMemberAccessOutcome(
    inviteSentAt ??
      (await sendMemberInvite(target, { replaceExisting: false })),
  );
}

export async function checkMemberAccess(
  tenantId: string,
  membershipId: string,
): Promise<TAccessCheck> {
  'use step';

  try {
    const target = await loadMemberAccessTarget(tenantId, membershipId);
    const outcome = target ? await resolveMemberAccess(target) : null;
    return { outcome, hasFailed: false };
  } catch (error) {
    if (!isFinalStepAttempt(error)) throw error;
    logger.error(MEMBER_ACCESS_LOG.CHECK_FAILED, {
      tenantId,
      membershipId,
      error: sanitizeLogMessage(error),
    });
    return { outcome: null, hasFailed: true };
  }
}

checkMemberAccess.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
