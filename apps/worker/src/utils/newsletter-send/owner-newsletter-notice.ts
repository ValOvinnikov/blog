import { EMAIL_ACCOUNT } from '@shinefold/config/constants';
import type { TNewsletterLimitNoticeKind } from '@shinefold/db/constants';
import type { TNewsletterLimits } from '@shinefold/db/queries/email-usage';
import { getTenantOwnerEmail } from '@shinefold/db/queries/memberships';
import {
  markNewsletterLimitNoticeSent,
  releaseNewsletterLimitNotice,
} from '@shinefold/db/queries/newsletter-post-sends';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { sendEmail } from '@shinefold/email';
import { sanitizeLogMessage } from '@shinefold/insight';
import { NEWSLETTER_SEND_LOG } from '@worker/constants/newsletter-send';
import { OWNER_SUBSCRIBERS_PATH } from '@worker/constants/owner-email';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import { readNewsletterMoveUpOffer } from '@worker/utils/newsletter-send/newsletter-move-up-offer';
import {
  buildOwnerNewsletterNotice,
  type TOwnerNewsletterPause,
} from '@worker/utils/newsletter-send/owner-newsletter-message';
import { ownerEmailFromAddress } from '@worker/utils/owner-email/owner-email-context';

export async function sendOwnerNewsletterNotice(
  tenant: TTenant,
  kind: TNewsletterLimitNoticeKind,
  limits: TNewsletterLimits,
  pause?: TOwnerNewsletterPause,
): Promise<void> {
  const { id: tenantId } = tenant;
  const platformUrl = env.PLATFORM_APP_BASE_URL;
  if (!platformUrl) {
    logger.error(NEWSLETTER_SEND_LOG.NO_PLATFORM_URL, { tenantId, kind });
    return;
  }
  const ownerEmail = await getTenantOwnerEmail(tenantId);
  if (!ownerEmail) {
    logger.warn(NEWSLETTER_SEND_LOG.OWNER_EMAIL_MISSING, { tenantId, kind });
    return;
  }

  if (!(await markNewsletterLimitNoticeSent(tenantId, kind))) return;

  try {
    const moveUp = await readNewsletterMoveUpOffer(tenant);
    await sendEmail({
      account: EMAIL_ACCOUNT.PLATFORM,
      to: ownerEmail,
      from: ownerEmailFromAddress(),
      ...buildOwnerNewsletterNotice(tenant, {
        kind,
        limits,
        pause,
        moveUp,
        subscribersUrl: new URL(OWNER_SUBSCRIBERS_PATH, platformUrl).toString(),
      }),
    });
  } catch (error) {
    logger.error(NEWSLETTER_SEND_LOG.OWNER_EMAIL_FAILED, {
      tenantId,
      kind,
      error: sanitizeLogMessage(error),
    });
    await releaseNewsletterLimitNotice(tenantId, kind);
  }
}
