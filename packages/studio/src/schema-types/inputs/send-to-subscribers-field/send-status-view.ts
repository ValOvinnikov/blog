import {
  NEWSLETTER_SEND_STATUS,
  type TNewsletterPostSendStatus,
} from '@shinefold/config';
import type { TMaybeUndefined } from '@shinefold/config/types';
import {
  formatSendCount,
  formatSendDay,
  formatSubscribers,
} from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-status-format';
import type { TSendStatusView } from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-status-types';
import {
  NOT_EMAILED,
  toSkippedView,
} from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/skipped-send-status-view';
import { isUndefined } from '@shinefold/utils/primitives';
import { Check, Clock } from 'lucide-react';

// A claim the run has not yet counted may still be scheduled or skipped, so it never reads as sending.
export const SEND_PENDING = 'Checking whether this post will be emailed…';
export const SEND_FAILED_BEFORE_ANY =
  ' — sending failed before any email went out.';

/** What replaces the switch once the post has a claim; `undefined` keeps the switch. */
export const toSendStatusView = (
  status: TNewsletterPostSendStatus,
): TMaybeUndefined<TSendStatusView> => {
  switch (status.status) {
    case NEWSLETTER_SEND_STATUS.NONE:
      return undefined;
    case NEWSLETTER_SEND_STATUS.SENT:
      return {
        tone: 'positive',
        icon: Check,
        lead: 'Emailed',
        detail: ` to ${formatSubscribers(status.recipients)} on ${formatSendDay(status.settledAt)}.`,
      };
    case NEWSLETTER_SEND_STATUS.SCHEDULED:
      return {
        tone: 'transparent',
        icon: Clock,
        lead: 'Scheduled',
        detail: ` — emailed on ${formatSendDay(status.scheduledFor)}.`,
      };
    case NEWSLETTER_SEND_STATUS.SENDING: {
      const { sent, recipients } = status;
      return {
        tone: 'transparent',
        detail: isUndefined(recipients)
          ? SEND_PENDING
          : `Sending… ${formatSendCount(sent ?? 0)} of ${formatSendCount(recipients)} so far.`,
      };
    }
    case NEWSLETTER_SEND_STATUS.FAILED: {
      const { sent, recipients } = status;
      return isUndefined(recipients)
        ? {
            tone: 'critical',
            lead: NOT_EMAILED,
            detail: SEND_FAILED_BEFORE_ANY,
          }
        : {
            tone: 'critical',
            detail: `Sending failed after ${formatSendCount(sent)} of ${formatSendCount(recipients)} — the rest were not emailed.`,
          };
    }
    case NEWSLETTER_SEND_STATUS.SKIPPED:
      return toSkippedView(status);
  }
};
