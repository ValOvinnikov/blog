import { EMAIL_USAGE_LEVEL } from '@shinefold/config/constants';
import type { TNewsletterLimits } from '@shinefold/db/queries/email-usage';
import type { TOwnerUsageRow } from '@shinefold/email';
import {
  OWNER_NEWSLETTER_EMAIL,
  type TOwnerNewsletterEmail,
} from '@worker/constants/owner-email';
import { sentAfterThisPost } from '@worker/utils/newsletter-send/newsletter-limits';
import type { TOwnerNewsletterEmailCopy } from '@worker/utils/owner-email/owner-newsletter-copy-input';

type TUsageMeter = Omit<TOwnerUsageRow, 'level' | 'hasBar'>;

export type TOwnerNewsletterUsageInput = {
  copy: TOwnerNewsletterEmailCopy;
  format: (value: number) => string;
  limits: TNewsletterLimits;
};

function usageMeter(
  { copy, format }: TOwnerNewsletterUsageInput,
  label: string,
  used: number,
  limit: number,
): TUsageMeter {
  return {
    label,
    value: copy.usageValue(format(used), format(limit)),
    used,
    limit,
  };
}

export function ownerNewsletterUsage(
  email: TOwnerNewsletterEmail,
  input: TOwnerNewsletterUsageInput,
): TOwnerUsageRow[] {
  const { copy, limits } = input;
  const { activeCount, bandCeiling, allowance, sentThisMonth } = limits;
  const { subscribersLabel, emailsLabel } = copy;
  const subscribers = usageMeter(
    input,
    subscribersLabel,
    activeCount,
    bandCeiling,
  );
  const emailsAfterPost = usageMeter(
    input,
    emailsLabel,
    sentAfterThisPost(limits),
    allowance,
  );
  const { NEAR, OVER, NORMAL } = EMAIL_USAGE_LEVEL;

  switch (email) {
    case OWNER_NEWSLETTER_EMAIL.BAND_NEAR:
      return [
        { ...subscribers, level: NEAR, hasBar: true },
        { ...emailsAfterPost, level: NORMAL },
      ];
    case OWNER_NEWSLETTER_EMAIL.EMAILS_NEAR:
      return [
        { ...emailsAfterPost, level: NEAR, hasBar: true },
        { ...subscribers, level: NORMAL },
      ];
    case OWNER_NEWSLETTER_EMAIL.BAND_PAUSED:
      return [{ ...subscribers, level: OVER, hasBar: true }];
    case OWNER_NEWSLETTER_EMAIL.EMAILS_PAUSED:
      return [
        {
          ...usageMeter(input, emailsLabel, sentThisMonth, allowance),
          level: OVER,
          hasBar: true,
        },
      ];
  }
}
