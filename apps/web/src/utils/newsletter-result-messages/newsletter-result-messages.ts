import type { TNewsletterResult } from '@blog/config';

type TNewsletterResultMessages = {
  namespace: 'newsletterConfirm' | 'newsletterUnsubscribe';
  title: string;
  message: string;
};

export const NEWSLETTER_RESULT_MESSAGES = {
  CONFIRMED: {
    namespace: 'newsletterConfirm',
    title: 'confirmedTitle',
    message: 'confirmedMessage',
  },
  CONFIRM_INVALID: {
    namespace: 'newsletterConfirm',
    title: 'invalidTitle',
    message: 'invalidMessage',
  },
  CONFIRM_UNAVAILABLE: {
    namespace: 'newsletterConfirm',
    title: 'unavailableTitle',
    message: 'unavailableMessage',
  },
  CONFIRM_FAILED: {
    namespace: 'newsletterConfirm',
    title: 'errorTitle',
    message: 'errorMessage',
  },
  UNSUBSCRIBED: {
    namespace: 'newsletterUnsubscribe',
    title: 'successTitle',
    message: 'successMessage',
  },
  UNSUBSCRIBE_INVALID: {
    namespace: 'newsletterUnsubscribe',
    title: 'invalidTitle',
    message: 'invalidMessage',
  },
  UNSUBSCRIBE_FAILED: {
    namespace: 'newsletterUnsubscribe',
    title: 'errorTitle',
    message: 'errorMessage',
  },
} as const satisfies Record<TNewsletterResult, TNewsletterResultMessages>;
