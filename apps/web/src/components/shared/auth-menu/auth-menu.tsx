'use client';

import { useOAuthErrorParam } from '@web/hooks/use-oauth-error-param';
import { usePopover } from '@web/hooks/use-popover';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { authMenuVariants } from './auth-menu-variants';
import { AccountMenu } from './components/account-menu/account-menu';
import { SignInMenu } from './components/sign-in-menu/sign-in-menu';

/**
 * AuthMenu — the header sign-in/account client island (#1107). Reads the
 * Auth.js session itself (`useSession`); takes no props. A thin dispatcher:
 * it owns the single `usePopover()` call (one logical popover, whichever
 * branch renders), `useOAuthErrorParam()`, and `useId()`, then renders
 * `AccountMenu` (logged-in) or `SignInMenu` (logged-out) with those passed
 * down as props. While the session is resolving it renders the real
 * `signInTrigger` button shell with its label hidden (not a differently-
 * shaped generic box) — a first-time/anonymous visitor resolving to that
 * logged-out state is the common case, so this reserves its exact footprint
 * and avoids the header reflow a mismatched placeholder size caused; same
 * `visibility`-hiding approach `ThemeToggleButton` already uses correctly.
 */
export function AuthMenu() {
  const sessionResult = useSession();
  const oauthError = useOAuthErrorParam();
  const t = useTranslations('authMenu');
  const panelId = useId();
  const { open, toggle, triggerRef, panelRef } = usePopover();
  const { signInTrigger, placeholderLabel } = authMenuVariants();

  if (sessionResult.status === 'loading') {
    return (
      <button
        type="button"
        disabled
        aria-hidden="true"
        className={signInTrigger()}
      >
        <span className={placeholderLabel()}>{t('signIn')}</span>
      </button>
    );
  }

  if (sessionResult.status === 'authenticated') {
    const { name, email, image } = sessionResult.data.user ?? {};

    return (
      <AccountMenu
        panelId={panelId}
        open={open}
        toggle={toggle}
        triggerRef={triggerRef}
        panelRef={panelRef}
        name={name}
        email={email}
        image={image}
      />
    );
  }

  return (
    <SignInMenu
      panelId={panelId}
      open={open}
      toggle={toggle}
      triggerRef={triggerRef}
      panelRef={panelRef}
      oauthError={oauthError}
    />
  );
}
