'use client';

import { routes } from '@blog/config';
import { Button } from '@blog/ui/atoms';
import { useToast } from '@web/context/toast-provider';
import {
  unlinkProviderAction,
  type TLinkableProvider,
} from '@web/server/account/identity-actions';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export type TProviderLinkControlProps = {
  provider: TLinkableProvider;
  action: 'link' | 'unlink';
};

/**
 * A single button whose behaviour switches on `action`, slotted into
 * `SettingRow.children` from the server-rendered `IdentitySection`.
 *
 * **"link"**: Auth.js v5 treats a provider-scoped `signIn(provider)` call
 * made from an *already-authenticated* session as an account-link rather
 * than a fresh sign-in, so `redirectTo` is pinned to `routes.account()` to
 * land back here once the provider round-trip completes and
 * `IdentitySection` re-fetches `getLinkedProviders` on the fresh page load.
 *
 * **"unlink"**: mirrors `NewsletterSubscriptionControl`'s pattern. The
 * server's atomic last-method guard can still reject even though
 * `IdentitySection` only renders this control when its own last-method
 * check passes (a concurrent unlink from another tab could invalidate that
 * check between render and click), so the error toast's message
 * distinguishes `reason: 'last-method'` from any other failure.
 */
export function ProviderLinkControl({
  provider,
  action,
}: TProviderLinkControlProps) {
  const t = useTranslations('accountPage.identity');
  const toast = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isLink = action === 'link';

  const handleLink = () => {
    startTransition(async () => {
      await signIn(provider, { redirectTo: routes.account() });
    });
  };

  const handleUnlink = () => {
    startTransition(async () => {
      try {
        await toast.promise(
          (async () => {
            const result = await unlinkProviderAction(provider);
            if (!result.ok) throw new Error(result.reason);
            return result;
          })(),
          {
            command: t('unlinkToastCommand'),
            loading: {
              state: t('unlinkToastLoadingState'),
              message: t('unlinkToastLoadingMessage'),
            },
            success: {
              state: t('unlinkToastSuccessState'),
              message: t('unlinkToastSuccessMessage'),
            },
            error: (error: unknown) => ({
              state: t('unlinkToastErrorState'),
              message:
                error instanceof Error && error.message === 'last-method'
                  ? t('unlinkLastMethodError')
                  : t('unlinkError'),
            }),
          },
        );
      } catch {
        // Already surfaced via the `toast.promise` error branch above —
        // swallow here so a failed unlink doesn't refresh the section below.
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
      onClick={isLink ? handleLink : handleUnlink}
    >
      {isLink ? t('linkButton') : t('unlinkButton')}
    </Button>
  );
}
