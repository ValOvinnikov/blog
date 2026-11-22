import 'server-only';

import {
  SUBSCRIBERS_NOTICE,
  SUBSCRIBERS_PAGE_SIZE,
  type TSubscribersNotice,
} from '@platform/constants/subscribers';
import { readNewsletterStop } from '@platform/server/newsletter-pause/read-newsletter-stop';
import {
  moveUpOfferFor,
  type TMoveUpOffer,
} from '@platform/utils/move-up-offer/move-up-offer';
import { resolveTotalPages } from '@platform/utils/pagination/pagination';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import {
  toSubscriberLimits,
  type TSubscriberLimits,
} from '@platform/utils/subscriber-limits/subscriber-limits';
import {
  NEWSLETTER_SKIP_REASON,
  type TMaybeUndefined,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TSkippedNewsletterPost } from '@shinefold/db/queries/newsletter-post-sends/get-latest-skipped-newsletter-post/get-latest-skipped-newsletter-post';
import type { TSubscribersPage } from '@shinefold/db/queries/subscribers/list-subscribers-page/list-subscribers-page';
import { nextSubscriberBand } from '@shinefold/db/utils/next-subscriber-band/next-subscriber-band';

export type TSubscribersPageData = TSubscriberLimits & {
  list: TSubscribersPage;
  page: number;
  totalPages: number;
  emailNewPosts: boolean;
  pausedAt: TMaybeUndefined<Date>;
  nextBand: TMaybeUndefined<number>;
  offer: TMaybeUndefined<TMoveUpOffer>;
  skippedPost: TMaybeUndefined<TSkippedNewsletterPost>;
};

const SKIP_REASON_FOR_NOTICE = {
  [SUBSCRIBERS_NOTICE.BAND_PAUSED]: NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND,
  [SUBSCRIBERS_NOTICE.EMAILS_PAUSED]:
    NEWSLETTER_SKIP_REASON.OVER_MONTHLY_ALLOWANCE,
} as const;

const OFFERING_NOTICES: readonly TSubscribersNotice[] = [
  SUBSCRIBERS_NOTICE.BAND_PAUSED,
  SUBSCRIBERS_NOTICE.EMAILS_PAUSED,
  SUBSCRIBERS_NOTICE.BAND_NEAR,
  SUBSCRIBERS_NOTICE.EMAILS_NEAR,
];

const readSkippedPost = (
  tenantId: string,
  notice: TMaybeUndefined<TSubscribersNotice>,
): Promise<TMaybeUndefined<TSkippedNewsletterPost>> =>
  notice === SUBSCRIBERS_NOTICE.BAND_PAUSED ||
  notice === SUBSCRIBERS_NOTICE.EMAILS_PAUSED
    ? queries.newsletterPostSends.getLatestSkippedNewsletterPost(
        tenantId,
        SKIP_REASON_FOR_NOTICE[notice],
      )
    : Promise.resolve(undefined);

const readOffer = async (
  tenant: TPlatformTenant,
  notice: TMaybeUndefined<TSubscribersNotice>,
): Promise<TMaybeUndefined<TMoveUpOffer>> =>
  notice && OFFERING_NOTICES.includes(notice)
    ? moveUpOfferFor(tenant, await queries.stripeCatalogue.listStripePrices())
    : undefined;

export const loadSubscribersPage = async (
  tenant: TPlatformTenant,
  page: number,
  movedUpCeiling: TMaybeUndefined<number>,
): Promise<TSubscribersPageData> => {
  const { id, subscriberBandCeiling } = tenant;
  const [list, limits, emailNewPosts, stop] = await Promise.all([
    queries.subscribers.listSubscribersPage(id, {
      page,
      pageSize: SUBSCRIBERS_PAGE_SIZE,
    }),
    queries.emailUsage.getNewsletterLimits(tenant),
    queries.emailConfig.getEmailNewPosts(id),
    readNewsletterStop(id),
  ]);
  const totalPages = resolveTotalPages({
    page,
    total: list.total,
    pageSize: SUBSCRIBERS_PAGE_SIZE,
    pageHref: adminRoutes.dashboardSubscribers,
  });
  const subscriberLimits = toSubscriberLimits({
    limits,
    isOperatorPaused: stop.isStopped,
    hasMovedUp: movedUpCeiling === limits.bandCeiling,
  });
  const { notice } = subscriberLimits;
  const [skippedPost, offer] = await Promise.all([
    readSkippedPost(id, notice),
    readOffer(tenant, notice),
  ]);

  return {
    ...subscriberLimits,
    list,
    page,
    totalPages,
    emailNewPosts,
    pausedAt: stop.pausedAt,
    nextBand: nextSubscriberBand(subscriberBandCeiling),
    offer,
    skippedPost,
  };
};
