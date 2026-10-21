import type { TMaybeNull } from '@blog/config/types';
import { TENANT_OWNER_EMAIL, type TTenantOwnerEmail } from '@blog/db/constants';
import {
  claimTenantOwnerEmail,
  releaseTenantOwnerEmail,
} from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { sendEmail } from '@blog/email';
import { sanitizeLogMessage } from '@blog/insight';
import {
  DEFAULT_OWNER_EMAIL_FROM_ADDRESS,
  OWNER_INVITE_NUDGE_AFTER_MS,
} from '@worker/constants/owner-email';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import type { TOwnerAccessTarget } from '@worker/utils/owner-access/owner-access-target';

import { buildOwnerEmailMessage } from './build-owner-email';

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
      to: ownerEmail,
      from: env.OWNER_EMAIL_FROM_ADDRESS ?? DEFAULT_OWNER_EMAIL_FROM_ADDRESS,
      ...buildOwnerEmailMessage(target, email),
    });
  } catch (error) {
    logger.error('owner_email.send_failed', {
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
    logger.error('owner_email.release_failed', {
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
