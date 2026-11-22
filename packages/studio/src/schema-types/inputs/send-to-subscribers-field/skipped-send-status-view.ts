import {
  type NEWSLETTER_SEND_STATUS,
  NEWSLETTER_SKIP_REASON,
  routes,
  type TNewsletterPostSendStatus,
} from '@shinefold/config';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { formatSendCount } from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-status-format';
import type {
  TSendStatusLink,
  TSendStatusView,
} from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-status-types';
import { SENDING_PAUSED } from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-switch-view';

const NOT_EMAILED = 'Not emailed';
const OPEN_SUBSCRIBERS: TSendStatusLink = {
  href: routes.dashboardSubscribers(),
  label: 'Open Subscribers',
};

const pausedView = (detail: string): TSendStatusView => ({
  tone: 'critical',
  lead: `${NOT_EMAILED}.`,
  detail: ` ${detail}`,
});

const offView = (
  detail: string,
  link: TSendStatusLink,
  isCauseCurrent: boolean,
): TSendStatusView => ({
  tone: 'transparent',
  lead: NOT_EMAILED,
  detail: ` — ${detail}`,
  link: isCauseCurrent ? link : undefined,
});

export const toSkippedView = (
  status: Extract<
    TNewsletterPostSendStatus,
    { status: typeof NEWSLETTER_SEND_STATUS.SKIPPED }
  >,
): TMaybeUndefined<TSendStatusView> => {
  const { sendingOffCause } = status;
  switch (status.skipReason) {
    case NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND:
      return {
        ...pausedView(
          `Sending was paused — your site passed its ${formatSendCount(status.bandCeiling)}-subscriber band. Once you're within your band, you can send it with Send emails.`,
        ),
        link: OPEN_SUBSCRIBERS,
      };
    case NEWSLETTER_SKIP_REASON.OVER_MONTHLY_ALLOWANCE:
      return {
        ...pausedView(
          "Sending was paused — this month's emails were used. Once the allowance covers it, you can send it with Send emails.",
        ),
        link: OPEN_SUBSCRIBERS,
      };
    case NEWSLETTER_SKIP_REASON.SITE_PAUSED:
    case NEWSLETTER_SKIP_REASON.REPUTATION_STOP:
    case NEWSLETTER_SKIP_REASON.SITE_INACTIVE:
      return pausedView(SENDING_PAUSED);
    case NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF:
      return offView(
        'the newsletter is off in Features.',
        { href: routes.dashboardFeatures(), label: 'Open Features' },
        sendingOffCause === NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF,
      );
    case NEWSLETTER_SKIP_REASON.SENDING_OFF:
      return offView(
        'sending was off when this was published.',
        { ...OPEN_SUBSCRIBERS, label: 'Turn it on in Subscribers' },
        sendingOffCause === NEWSLETTER_SKIP_REASON.SENDING_OFF,
      );
    case NEWSLETTER_SKIP_REASON.NOT_IN_PLAN:
      return undefined;
  }
};
