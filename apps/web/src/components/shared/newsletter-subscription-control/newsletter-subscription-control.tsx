'use client';

import { Button } from '@blog/ui/atoms';
import { useToast } from '@web/components/shared/toast-provider';
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
 * NewsletterSubscriptionControl — the `/account` 6b section's action-slot
 * client island (#1155/#1158): a single button whose copy and server action
 * are picked by `action`. Slotted into `SettingRow.children` from the
 * server-rendered `NewsletterSection` (`web-component-practices` Rule 1 —
 * the pure `SettingRow` never wraps this, it just renders it), so only this
 * leaf pays for the client boundary.
 *
 * Mirrors `DeleteAccountControl`'s exact pattern: the matching server
 * action (`unsubscribeAction`/`resendConfirmationAction`, both session-gated
 * and resolving a `Result` rather than throwing) runs through `useToast`'s
 * `promise` helper for the loading/success/error toast lifecycle, wrapped in
 * a thin async function that throws when `result.ok` is `false` to drive
 * the error branch. Unlike delete (which signs out + redirects), a
 * successful unsubscribe/resend needs the page to reflect the new
 * subscription state rather than navigate away — `router.refresh()`
 * re-runs `NewsletterSection`'s server-side `getSubscriptionStatus` call so
 * the UI updates (unsubscribe → the whole section disappears; resend →
 * stays on the same pending state, just re-sent). `isPending`
 * (`useTransition`) separately gates the button's `disabled`/`aria-busy`
 * state — `toast.promise` owns the toast lifecycle, `useTransition` owns
 * the local pending UI.
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
