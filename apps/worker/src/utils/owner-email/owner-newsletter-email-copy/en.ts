import { BILLING_INTERVAL } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { PLATFORM_EMAIL_BRAND_NAME } from '@shinefold/email';
import { OWNER_NEWSLETTER_EMAIL } from '@worker/constants/owner-email';
import type {
  TOwnerNewsletterEmailCopy,
  TOwnerNewsletterMoveUp,
} from '@worker/utils/owner-email/owner-newsletter-copy-input';

function pausedSubject(siteName: string): string {
  return `Post emails are paused on ${siteName}`;
}
const PAUSED_HEADING = 'New posts are no longer being emailed';
function nearClosing(
  moveUp: TMaybeUndefined<TOwnerNewsletterMoveUp>,
): TMaybeUndefined<string> {
  return (
    moveUp &&
    `The ${moveUp.ceiling} band costs ${moveUp.extra} and starts the moment you choose it. Nothing changes unless you do.`
  );
}

export const OWNER_NEWSLETTER_EMAIL_COPY_EN: TOwnerNewsletterEmailCopy = {
  subscribersLabel: 'Subscribers',
  emailsLabel: 'Emails this month',
  usageValue: (used, limit) => `${used} of ${limit}`,
  extraPrice: {
    [BILLING_INTERVAL.MONTHLY]: (price) => `${price} a month more`,
    [BILLING_INTERVAL.YEARLY]: (price) => `${price} a year more`,
  },
  actionLabel: 'Open Subscribers',
  footerLine: (siteName) =>
    `You get this because you own ${siteName} on ${PLATFORM_EMAIL_BRAND_NAME}.`,
  reputationPaused: (siteName) => ({
    subject: pausedSubject(siteName),
    heading: PAUSED_HEADING,
    paragraphs: [
      `Too many emails from ${siteName} bounced or were marked as spam, so sending is paused to protect its delivery. Posts still publish and readers can still subscribe, but new posts are not emailed until support resumes sending.`,
    ],
    closingLine: 'Contact support to resume sending.',
  }),
  emails: {
    [OWNER_NEWSLETTER_EMAIL.BAND_NEAR]: ({
      siteName,
      activeCount,
      bandCeiling,
      moveUp,
    }) => ({
      subject: `${siteName} is close to its subscriber limit`,
      heading: 'You’re close to your subscriber limit',
      paragraphs: [
        `${siteName} has ${activeCount} confirmed subscribers, and its band is ${bandCeiling}. When it reaches ${bandCeiling}, new posts stop being emailed until you move up or the list shrinks.`,
      ],
      closingLine: nearClosing(moveUp),
    }),
    [OWNER_NEWSLETTER_EMAIL.EMAILS_NEAR]: ({
      siteName,
      sent,
      allowance,
      resetDate,
      moveUp,
    }) => ({
      subject: `${siteName} is close to its monthly email limit`,
      heading: 'You’ve used most of this month’s emails',
      paragraphs: [
        `${siteName} has sent ${sent} of its ${allowance} emails this month. A post goes out only if it fits whole, and the allowance resets on ${resetDate}.`,
      ],
      closingLine: nearClosing(moveUp),
    }),
    [OWNER_NEWSLETTER_EMAIL.BAND_PAUSED]: ({
      siteName,
      bandCeiling,
      postTitle,
      moveUp,
    }) => ({
      subject: pausedSubject(siteName),
      heading: PAUSED_HEADING,
      paragraphs: [
        `${siteName} passed its ${bandCeiling}-subscriber band, so “${postTitle}” was published but not emailed. Once you’re within your band, you can send it with Send emails on the post in the Studio. Posts still publish and readers can still subscribe.`,
      ],
      closingLine: moveUp
        ? `Move to the ${moveUp.ceiling} band (${moveUp.extra}) and your next post is emailed, or bring the list back under ${bandCeiling}.`
        : `Bring the list back under ${bandCeiling} and your next post is emailed.`,
    }),
    [OWNER_NEWSLETTER_EMAIL.EMAILS_PAUSED]: ({
      siteName,
      allowance,
      resetDate,
      postTitle,
      moveUp,
    }) => ({
      subject: pausedSubject(siteName),
      heading: PAUSED_HEADING,
      paragraphs: [
        `${siteName} has used this month’s ${allowance} emails, so “${postTitle}” was published but not emailed. Sending starts again on ${resetDate}; once the allowance covers it, you can send the post with Send emails in the Studio.`,
      ],
      closingLine:
        moveUp &&
        `Move to the ${moveUp.ceiling} band (${moveUp.extra}) and your next post is emailed, or wait for ${resetDate}.`,
    }),
  },
};
