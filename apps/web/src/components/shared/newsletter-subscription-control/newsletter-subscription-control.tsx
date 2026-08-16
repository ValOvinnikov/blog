'use client';

import { Button } from '@blog/ui/atoms';
import { useToast } from '@web/context/toast-provider';
import {
  resendConfirmationAction,
  unsubscribeAction,
} from '@web/server/account/newsletter-subscription-actions';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export type TNewsletterSubscriptionControlProps = {
  /**
   * Which 6b action this button triggers — the `SettingRow` control slot
   * for the `active` (`'unsubscribe'`) and `pending` (`'resend'`) states
   * respectively.
   */
  action: 'unsubscribe' | 'resend';
};

/**
 * Slotted into `SettingRow.children` as the sole client boundary: a single
 * button whose copy and server action are picked by `action`. Mirrors
 * `DeleteAccountControl`'s pattern, but a successful unsubscribe/resend
 * calls `router.refresh()` instead of navigating away, so it re-runs
 * `NewsletterSection`'s server-side `getSubscriptionStatus` call and the UI
 * reflects the new state.
 */
export function NewsletterSubscriptionControl({
  action,
}: TNewsletterSubscriptionControlProps) {
  const t = useTranslations('accountPage.newsletter');
  const toast = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isUnsubscribe = action === 'unsubscribe';
  const commandKey = isUnsubscribe
    ? 'unsubscribeToastCommand'
    : 'resendToastCommand';
  const loadingStateKey = isUnsubscribe
    ? 'unsubscribeToastLoadingState'
    : 'resendToastLoadingState';
  const loadingMessageKey = isUnsubscribe
    ? 'unsubscribeToastLoadingMessage'
    : 'resendToastLoadingMessage';
  const successStateKey = isUnsubscribe
    ? 'unsubscribeToastSuccessState'
    : 'resendToastSuccessState';
  const successMessageKey = isUnsubscribe
    ? 'unsubscribeToastSuccessMessage'
    : 'resendToastSuccessMessage';
  const errorStateKey = isUnsubscribe
    ? 'unsubscribeToastErrorState'
    : 'resendToastErrorState';
  const errorMessageKey = isUnsubscribe ? 'unsubscribeError' : 'resendError';

  const handleClick = () => {
    startTransition(async () => {
      try {
        await toast.promise(
          (async () => {
            const result = isUnsubscribe
              ? await unsubscribeAction()
              : await resendConfirmationAction();
            if (!result.ok) throw new Error(`Failed to ${action}`);
            return result;
          })(),
          {
            command: t(commandKey),
            loading: {
              state: t(loadingStateKey),
              message: t(loadingMessageKey),
            },
            success: {
              state: t(successStateKey),
              message: t(successMessageKey),
            },
            error: {
              state: t(errorStateKey),
              message: t(errorMessageKey),
            },
          },
        );
      } catch {
        // Already surfaced via the `toast.promise` error branch above —
        // swallow here so a failed action doesn't refresh the section below.
        return;
      }

      router.refresh();
    });
  };

  return (
    <Button
      variant="ghost"
      disabled={isPending}
      aria-busy={isPending}
      onClick={handleClick}
    >
      {isUnsubscribe ? t('unsubscribeButton') : t('resendButton')}
    </Button>
  );
}
