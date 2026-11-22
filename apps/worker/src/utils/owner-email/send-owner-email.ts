import { EMAIL_ACCOUNT } from '@shinefold/config/constants';
import type { TMaybeNull } from '@shinefold/config/types';
import {
  TENANT_OWNER_EMAIL,
  type TTenantOwnerEmail,
} from '@shinefold/db/constants';
import {
  claimTenantOwnerEmail,
  releaseTenantOwnerEmail,
} from '@shinefold/db/queries/tenants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { sendEmail } from '@shinefold/email';
import { sanitizeLogMessage } from '@shinefold/insight';
import {
  OWNER_EMAIL_LOG,
  OWNER_INVITE_NUDGE_AFTER_MS,
} from '@worker/constants/owner-email';
import { logger } from '@worker/utils/logger/logger';
import type { TOwnerAccessTarget } from '@worker/utils/owner-access/owner-access-target';

import { buildOwnerEmailMessage } from './build-owner-email';
import { ownerEmailFromAddress } from './owner-email-context';

export async function sendOwnerEmailOnce(
  target: TOwnerAccessTarget,
  email: TTenantOwnerEmail,
): Promise<void> {
  const { tenant, ownerEmail } = target;
  let claimedAt: TMaybeNull<Date> = null;
  try {
    claimedAt = await claimTenantOwnerEmail(tenant.id, email);
    if (!claimedAt) return;
    await sendEmail({
      account: EMAIL_ACCOUNT.PLATFORM,
      to: ownerEmail,
      from: ownerEmailFromAddress(),
      ...buildOwnerEmailMessage(target, email),
    });
  } catch (error) {
    logger.error(OWNER_EMAIL_LOG.SEND_FAILED, {
      tenantId: tenant.id,
      email,
      error: sanitizeLogMessage(error),
    });
    if (claimedAt) await releaseClaim(tenant.id, email, claimedAt);
  }
}

async function releaseClaim(
  tenantId: string,
  email: TTenantOwnerEmail,
  claimedAt: Date,
): Promise<void> {
  try {
    await releaseTenantOwnerEmail(tenantId, email, claimedAt);
  } catch (error) {
    logger.error(OWNER_EMAIL_LOG.RELEASE_FAILED, {
      tenantId,
      email,
      error: sanitizeLogMessage(error),
    });
  }
}

function isInviteNudgeDue(tenant: TTenant): boolean {
  const { ownerInviteSentAt, ownerInviteNudgeSentAt } = tenant;
  return (
    !ownerInviteNudgeSentAt &&
    !!ownerInviteSentAt &&
    Date.now() - ownerInviteSentAt.getTime() >= OWNER_INVITE_NUDGE_AFTER_MS
  );
}

export async function sendPendingOwnerEmails(
  target: TOwnerAccessTarget,
): Promise<void> {
  const { tenant } = target;
  if (!tenant.ownerInviteHeadsUpSentAt) {
    await sendOwnerEmailOnce(target, TENANT_OWNER_EMAIL.INVITE_HEADS_UP);
  }
  if (isInviteNudgeDue(tenant)) {
    await sendOwnerEmailOnce(target, TENANT_OWNER_EMAIL.INVITE_NUDGE);
  }
}
