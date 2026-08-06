'use client';

import { Spinner } from '@blog/ui/atoms/spinner';
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
 * down as props. While the session is resolving it renders a neutral,
 * non-interactive spinner status region — shaped like neither the sign-in
 * button nor the account avatar, so whichever one mounts once the session
 * resolves never flashes through the *other* state's shape first. This
 * trades away exact footprint reservation (the header can resize slightly
 * once the real trigger mounts) for never showing a misleading placeholder
 * shape.
 */
export function AuthMenu() {
  const sessionResult = useSession();
  const oauthError = useOAuthErrorParam();
  const t = useTranslations('authMenu');
  const panelId = useId();
  const { open, toggle, triggerRef, panelRef } = usePopover();
  const { statusIndicator } = authMenuVariants();

  if (sessionResult.status === 'loading') {
    return (
      // `Spinner` owns the live-region semantics (`role="status"` +
      // `aria-label`) itself — this wrapper only reserves the 22×22
      // footprint of the sign-in button / avatar trigger it stands in for.
      <span className={statusIndicator()}>
        <Spinner label={t('loadingAccountStatus')} />
      </span>
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
