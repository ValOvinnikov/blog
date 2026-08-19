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
 * The header sign-in/account client island. Reads the Auth.js session
 * itself (`useSession`); a thin dispatcher that owns the single
 * `usePopover()` call and renders `AccountMenu` (logged-in) or `SignInMenu`
 * (logged-out). While the session is resolving it renders a neutral,
 * non-interactive spinner — shaped like neither the sign-in button nor the
 * account avatar, so whichever one mounts never flashes through the
 * *other* state's shape first.
 */
export interface IAuthMenuProps {
  /** Renders both branches' panel without the `WindowChrome` shell. */
  isPlain?: boolean;
}

export function AuthMenu({ isPlain = false }: IAuthMenuProps) {
  const sessionResult = useSession();
  const oauthError = useOAuthErrorParam();
  const t = useTranslations('authMenu');
  const panelId = useId();
  const { open, toggle, triggerRef, panelRef } = usePopover();
  const { statusIndicator } = authMenuVariants();

  if (sessionResult.status === 'loading') {
    return (
      // `Spinner` owns the live-region semantics (`role="status"` +
      // `aria-label`) itself — this wrapper only reserves the 32×32
      // footprint of the sign-in button / avatar trigger it stands in for.
      <span className={statusIndicator()}>
        <Spinner size="LG" label={t('loadingAccountStatus')} />
      </span>
    );
  }

  if (sessionResult.status === 'authenticated') {
    const { name, email, image } = sessionResult.data.user ?? {};

    return (
      <AccountMenu
        panelId={panelId}
        isOpen={open}
        toggle={toggle}
        triggerRef={triggerRef}
        panelRef={panelRef}
        name={name}
        email={email}
        image={image}
        isPlain={isPlain}
      />
    );
  }

  return (
    <SignInMenu
      panelId={panelId}
      isOpen={open}
      toggle={toggle}
      triggerRef={triggerRef}
      panelRef={panelRef}
      oauthError={oauthError}
      isPlain={isPlain}
    />
  );
}
