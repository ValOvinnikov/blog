import {
  LOCALE_BCP47_TAGS,
  NEWSLETTER_SKIP_REASON,
  type TLocaleIsoCode,
  type TNewsletterSkipReason,
} from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import {
  NEWSLETTER_LIMIT_NOTICE_KIND,
  type TNewsletterLimitNoticeKind,
} from '@shinefold/db/constants';
import type { TNewsletterLimits } from '@shinefold/db/queries/email-usage';
import type { TTenant } from '@shinefold/db/schema/tenants';
import {
  buildOwnerNewsletterLimitNearEmail,
  buildOwnerNewsletterPausedEmail,
  PLATFORM_EMAIL_BRAND_NAME,
  type TOwnerEmail,
} from '@shinefold/email';
import {
  OWNER_NEWSLETTER_EMAIL,
  type TOwnerNewsletterEmail,
} from '@worker/constants/owner-email';
import { formatInactivityDate } from '@worker/utils/inactivity-sweep/inactivity-dates';
import {
  allowanceResetDate,
  sentAfterThisPost,
} from '@worker/utils/newsletter-send/newsletter-limits';
import type { TNewsletterMoveUpOffer } from '@worker/utils/newsletter-send/newsletter-move-up-offer';
import { ownerNewsletterUsage } from '@worker/utils/newsletter-send/owner-newsletter-usage';
import type { TOwnerNewsletterEmailCopy } from '@worker/utils/owner-email/owner-newsletter-copy-input';
import { OWNER_NEWSLETTER_EMAIL_COPY } from '@worker/utils/owner-email/owner-newsletter-email-copy/owner-newsletter-email-copy';

export type TOwnerNewsletterPause = {
  skipReason: TNewsletterSkipReason;
  postTitle: string;
};

export type TOwnerNewsletterNoticeInput = {
  kind: TNewsletterLimitNoticeKind;
  limits: TNewsletterLimits;
  pause: TMaybeUndefined<TOwnerNewsletterPause>;
  moveUp: TMaybeUndefined<TNewsletterMoveUpOffer>;
  subscribersUrl: string;
};

const DECIMAL_BASE = 10;

function ownerNewsletterEmailFor(
  kind: TNewsletterLimitNoticeKind,
  pause: TMaybeUndefined<TOwnerNewsletterPause>,
): TOwnerNewsletterEmail {
  switch (kind) {
    case NEWSLETTER_LIMIT_NOTICE_KIND.SUBSCRIBER_BAND_NEAR:
      return OWNER_NEWSLETTER_EMAIL.BAND_NEAR;
    case NEWSLETTER_LIMIT_NOTICE_KIND.MONTHLY_ALLOWANCE_NEAR:
      return OWNER_NEWSLETTER_EMAIL.EMAILS_NEAR;
    case NEWSLETTER_LIMIT_NOTICE_KIND.SENDING_PAUSED:
      return pause?.skipReason === NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND
        ? OWNER_NEWSLETTER_EMAIL.BAND_PAUSED
        : OWNER_NEWSLETTER_EMAIL.EMAILS_PAUSED;
  }
}

function formatExtraPrice(
  copy: TOwnerNewsletterEmailCopy,
  locale: TLocaleIsoCode,
  { interval, currency, extraMinorUnits }: TNewsletterMoveUpOffer,
): string {
  const formatter = new Intl.NumberFormat(LOCALE_BCP47_TAGS[locale], {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
  const { maximumFractionDigits = 0 } = formatter.resolvedOptions();
  return copy.extraPrice[interval](
    formatter.format(extraMinorUnits / DECIMAL_BASE ** maximumFractionDigits),
  );
}

export function buildOwnerNewsletterNotice(
  { name: siteName, locale }: TTenant,
  { kind, limits, pause, moveUp, subscribersUrl }: TOwnerNewsletterNoticeInput,
): TOwnerEmail {
  const copy = OWNER_NEWSLETTER_EMAIL_COPY[locale];
  const { format } = new Intl.NumberFormat(LOCALE_BCP47_TAGS[locale]);
  const { activeCount, bandCeiling, allowance } = limits;
  const email = ownerNewsletterEmailFor(kind, pause);
  const { closingLine, ...text } = copy.emails[email]({
    siteName,
    activeCount: format(activeCount),
    bandCeiling: format(bandCeiling),
    allowance: format(allowance),
    sent: format(sentAfterThisPost(limits)),
    resetDate: formatInactivityDate(allowanceResetDate(new Date()), locale),
    postTitle: pause?.postTitle ?? '',
    moveUp: moveUp && {
      ceiling: format(moveUp.ceiling),
      extra: formatExtraPrice(copy, locale, moveUp),
    },
  });
  const input = {
    brandName: PLATFORM_EMAIL_BRAND_NAME,
    ...text,
    usage: ownerNewsletterUsage(email, { copy, format, limits }),
    closingLine,
    action: { label: copy.actionLabel, url: subscribersUrl },
    footerLine: copy.footerLine(siteName),
  };

  return kind === NEWSLETTER_LIMIT_NOTICE_KIND.SENDING_PAUSED
    ? buildOwnerNewsletterPausedEmail(input)
    : buildOwnerNewsletterLimitNearEmail(input);
}
