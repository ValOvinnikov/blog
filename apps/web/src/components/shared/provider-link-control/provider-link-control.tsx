'use client';

import { routes } from '@blog/config';
import { Button } from '@blog/ui/atoms';
import { useToast } from '@web/components/shared/toast-provider';
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
 * ProviderLinkControl — the `/account` 6c section's provider-row action-slot
 * client island (#1159/#1162): a single button whose behaviour switches on
 * `action`. Slotted into `SettingRow.children` from the server-rendered
 * `IdentitySection` (`web-component-practices` Rule 1 — the pure
 * `SettingRow` never wraps this, it just renders it), so only this leaf pays
 * for the client boundary.
 *
 * **"link"**: Auth.js v5 treats a provider-scoped `signIn(provider)` call
 * made from an *already-authenticated* session as an account-link rather
 * than a fresh sign-in — `@auth/core`'s `handleLoginOrRegister` reads the
 * existing session cookie first, and when the OAuth account being signed in
 * with isn't already linked to a *different* user, it calls the adapter's
 * `linkAccount` against the current session's user rather than creating a
 * new one (verified against `@auth/core`'s own source, since this repo had
 * no prior linking-from-an-authenticated-session precedent — only
 * `sign-in-menu.tsx`'s fresh, logged-out `signIn(providerId)` call). This is
 * a full-page redirect flow (`signIn` navigates the browser to the
 * provider's consent screen and back), not a fetch this component can await
 * a `Result` from, so `redirectTo` is pinned to `routes.account()` to land
 * back here once the provider round-trip completes and `IdentitySection`
 * re-fetches `getLinkedProviders` on the fresh page load.
 *
 * **"unlink"**: mirrors `NewsletterSubscriptionControl`'s exact pattern —
 * the session-gated `unlinkProviderAction` runs through `useToast`'s
 * `promise` helper for the loading/success/error toast lifecycle, wrapped in
 * a thin async function that throws when `result.ok` is `false`. The
 * server's atomic last-method guard can still reject even though
 * `IdentitySection` only renders this control when its own last-method
 * check passes (a concurrent unlink from another tab could invalidate that
 * check between render and click), so the error toast's message
 * distinguishes `reason: 'last-method'` from any other failure. A
 * successful unlink needs the page to reflect the new linked-provider state
 * rather than navigate away, so `router.refresh()` re-runs
 * `IdentitySection`'s server-side `getLinkedProviders` call. `isPending`
 * (`useTransition`) separately gates the button's `disabled`/`aria-busy`
 * state for both actions.
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
