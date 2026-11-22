import {
  NEWSLETTER_SEND_STATUS,
  NEWSLETTER_SKIP_REASON,
  type TNewsletterPostSendStatus,
  type TNewsletterSendingOffCause,
} from '@shinefold/config';
import { formatSendCount } from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-status-format';

export type TSendSwitchView = { isDisabled: boolean; description: string };

export const SENDING_PAUSED = 'Sending is paused for this site.';

const OFF_CAUSE_SWITCH_NOTE: Readonly<
  Partial<Record<TNewsletterSendingOffCause, string>>
> = {
  [NEWSLETTER_SKIP_REASON.SITE_INACTIVE]: SENDING_PAUSED,
  [NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF]:
    'The newsletter is off for this site. Turn it on in Features.',
  [NEWSLETTER_SKIP_REASON.SENDING_OFF]:
    'Emailing posts is off for this site. Turn it on in Subscribers.',
};

export const isSendFieldHidden = (status: TNewsletterPostSendStatus): boolean =>
  status.sendingOffCause === NEWSLETTER_SKIP_REASON.NOT_IN_PLAN ||
  (status.status === NEWSLETTER_SEND_STATUS.SKIPPED &&
    status.skipReason === NEWSLETTER_SKIP_REASON.NOT_IN_PLAN);

export const toSendSwitchView = ({
  confirmedCount,
  sendingOffCause,
}: Pick<
  TNewsletterPostSendStatus,
  'confirmedCount' | 'sendingOffCause'
>): TSendSwitchView => {
  const note = sendingOffCause && OFF_CAUSE_SWITCH_NOTE[sendingOffCause];
  if (note) return { isDisabled: true, description: note };

  const audience =
    confirmedCount > 0
      ? `your ${formatSendCount(confirmedCount)} confirmed subscribers`
      : 'your confirmed subscribers';
  return {
    isDisabled: false,
    description: `Emails this post to ${audience} when it's first published. Later edits never send it again.`,
  };
};
