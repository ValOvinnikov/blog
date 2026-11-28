import { EMAIL_ACCOUNT } from '@shinefold/config/constants';
import {
  NEWSLETTER_LIMIT_NOTICE_KIND,
  type TNewsletterLimitNoticeKind,
} from '@shinefold/db/constants';
import type { TNewsletterLimits } from '@shinefold/db/queries/email-usage';
import { getTenantOwnerEmail } from '@shinefold/db/queries/memberships';
import {
  markNewsletterLimitNoticeSent,
  releaseNewsletterLimitNotice,
} from '@shinefold/db/queries/newsletter-post-sends';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { sendEmail, type TOwnerEmail } from '@shinefold/email';
import { sanitizeLogMessage } from '@shinefold/insight';
import { NEWSLETTER_SEND_LOG } from '@worker/constants/newsletter-send';
import { OWNER_SUBSCRIBERS_PATH } from '@worker/constants/owner-email';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import type { TOwnerLimitNoticeKind } from '@worker/utils/newsletter-send/newsletter-limits';
import { readNewsletterMoveUpOffer } from '@worker/utils/newsletter-send/newsletter-move-up-offer';
import {
  buildOwnerNewsletterNotice,
  buildOwnerReputationPauseNotice,
  type TOwnerNewsletterPause,
} from '@worker/utils/newsletter-send/owner-newsletter-message';
import { ownerEmailFromAddress } from '@worker/utils/owner-email/owner-email-context';

type TOwnerNoticeDelivery = {
  kind: TNewsletterLimitNoticeKind;
  since?: Date;
  build: (subscribersUrl: string) => Promise<TOwnerEmail>;
};

async function deliverOwnerNewsletterNotice(
  { id: tenantId }: TTenant,
  { kind, since, build }: TOwnerNoticeDelivery,
): Promise<void> {
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

  if (!(await markNewsletterLimitNoticeSent(tenantId, kind, { since }))) {
    return;
  }

  try {
    await sendEmail({
      account: EMAIL_ACCOUNT.PLATFORM,
      to: ownerEmail,
      from: ownerEmailFromAddress(),
      ...(await build(new URL(OWNER_SUBSCRIBERS_PATH, platformUrl).toString())),
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

export async function sendOwnerNewsletterNotice(
  tenant: TTenant,
  kind: TOwnerLimitNoticeKind,
  limits: TNewsletterLimits,
  pause?: TOwnerNewsletterPause,
): Promise<void> {
  await deliverOwnerNewsletterNotice(tenant, {
    kind,
    build: async (subscribersUrl) =>
      buildOwnerNewsletterNotice(tenant, {
        kind,
        limits,
        pause,
        moveUp: await readNewsletterMoveUpOffer(tenant),
        subscribersUrl,
      }),
  });
}

export async function sendOwnerReputationPauseNotice(
  tenant: TTenant,
  pausedAt: Date,
): Promise<void> {
  const kind = NEWSLETTER_LIMIT_NOTICE_KIND.REPUTATION_PAUSED;
  try {
    await deliverOwnerNewsletterNotice(tenant, {
      kind,
      since: pausedAt,
      build: (subscribersUrl) =>
        Promise.resolve(
          buildOwnerReputationPauseNotice(tenant, subscribersUrl),
        ),
    });
  } catch (error) {
    logger.error(NEWSLETTER_SEND_LOG.OWNER_EMAIL_FAILED, {
      tenantId: tenant.id,
      kind,
      error: sanitizeLogMessage(error),
    });
  }
}
