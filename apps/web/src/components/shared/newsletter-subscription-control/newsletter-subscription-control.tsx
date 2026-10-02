'use client';

import { Button } from '@blog/ui/components/atoms/button';
import { useToast } from '@web/context/toast-provider';
import {
  resendConfirmationAction,
  unsubscribeAction,
} from '@web/server/newsletter/newsletter-subscription-actions';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export type TNewsletterSubscriptionControlProps = {
  action: 'unsubscribe' | 'resend';
};

export const NewsletterSubscriptionControl = ({
  action,
}: TNewsletterSubscriptionControlProps) => {
  const t = useTranslations('accountPage.newsletter');
  const toast = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isUnsubscribe = action === 'unsubscribe';
  const loadingMessageKey = isUnsubscribe
    ? 'unsubscribeToastLoadingMessage'
    : 'resendToastLoadingMessage';
  const successMessageKey = isUnsubscribe
    ? 'unsubscribeToastSuccessMessage'
    : 'resendToastSuccessMessage';
  const errorMessageKey = isUnsubscribe ? 'unsubscribeError' : 'resendError';

  const handleClick = () => {
    startTransition(async () => {
      let isUnavailable = false;
      try {
        await toast.promise(
          (async () => {
            const result = isUnsubscribe
              ? await unsubscribeAction()
              : await resendConfirmationAction();
            if (!result.ok) {
              isUnavailable = result.isUnavailable;
              throw new Error(`Failed to ${action}`);
            }
            return result;
          })(),
          {
            loading: { message: t(loadingMessageKey) },
            success: { message: t(successMessageKey) },
            error: () => ({
              message: t(
                isUnavailable && !isUnsubscribe
                  ? 'resendUnavailable'
                  : errorMessageKey,
              ),
            }),
          },
        );
      } catch {
        return;
      }

      router.refresh();
    });
  };

  return (
    <Button
      variant="ghost"
      isDisabled={isPending}
      aria-busy={isPending}
      onClick={handleClick}
    >
      {isUnsubscribe ? t('unsubscribeButton') : t('resendButton')}
    </Button>
  );
};
