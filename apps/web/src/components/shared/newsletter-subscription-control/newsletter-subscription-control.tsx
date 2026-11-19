'use client';

import { ACTION_OUTCOME } from '@shinefold/config';
import type { TValueOf } from '@shinefold/config/utils';
import { Button } from '@shinefold/ui/components/atoms/button';
import { NEWSLETTER_SUBSCRIPTION_ACTION } from '@web/constants/newsletter';
import { useBusyStyle } from '@web/context/busy-style-provider';
import { useActionToast } from '@web/hooks/use-action-toast';
import {
  resendConfirmationAction,
  unsubscribeAction,
} from '@web/server/newsletter/newsletter-subscription-actions/newsletter-subscription-actions';
import { useTranslations } from 'next-intl';

export type TNewsletterSubscriptionControlProps = {
  action: TValueOf<typeof NEWSLETTER_SUBSCRIPTION_ACTION>;
};

export const NewsletterSubscriptionControl = ({
  action,
}: TNewsletterSubscriptionControlProps) => {
  const t = useTranslations('accountPage.newsletter');
  const { busyStyle, spinnerVariant } = useBusyStyle();
  const { isPending, run } = useActionToast();

  const isUnsubscribe = action === NEWSLETTER_SUBSCRIPTION_ACTION.UNSUBSCRIBE;
  const loadingMessageKey = isUnsubscribe
    ? 'unsubscribeToastLoadingMessage'
    : 'resendToastLoadingMessage';
  const successMessageKey = isUnsubscribe
    ? 'unsubscribeToastSuccessMessage'
    : 'resendToastSuccessMessage';
  const errorMessageKey = isUnsubscribe ? 'unsubscribeError' : 'resendError';

  const handleClick = () => {
    run(isUnsubscribe ? unsubscribeAction : resendConfirmationAction, {
      loading: t(loadingMessageKey),
      success: t(successMessageKey),
      error: t(errorMessageKey),
      errorByOutcome: { [ACTION_OUTCOME.UNAVAILABLE]: t('resendUnavailable') },
    });
  };

  return (
    <Button
      variant="ghost"
      isBusy={isPending}
      busyLabel={isUnsubscribe ? t('unsubscribingLabel') : t('resendingLabel')}
      busyStyle={busyStyle}
      spinnerVariant={spinnerVariant}
      onClick={handleClick}
    >
      {isUnsubscribe ? t('unsubscribeButton') : t('resendButton')}
    </Button>
  );
};
