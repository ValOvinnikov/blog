'use client';

import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { ACCOUNT_OVERLAY_ID } from '@web/context/header-overlay-provider';
import { useOAuthErrorParam } from '@web/hooks/use-oauth-error-param';
import { usePopover } from '@web/hooks/use-popover';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { authMenuVariants } from './auth-menu-variants';
import { AccountMenu } from './components/account-menu/account-menu';
import { AccountSlot } from './components/account-slot/account-slot';
import { SignInMenu } from './components/sign-in-menu/sign-in-menu';

export interface IAuthMenuProps {
  oauthProviderIds: readonly TOAuthProviderId[];
}

export const AuthMenu = ({ oauthProviderIds }: IAuthMenuProps) => {
  const sessionResult = useSession();
  const oauthError = useOAuthErrorParam();
  const t = useTranslations('authMenu');
  const panelId = useId();
  const { open, toggle, triggerRef, panelRef } = usePopover({
    overlayId: ACCOUNT_OVERLAY_ID,
  });
  const { loadingStatus } = authMenuVariants();

  if (sessionResult.status === 'loading') {
    return (
      <AccountSlot isPlaceholder={true}>
        <span
          role="status"
          aria-label={t('loadingAccountStatus')}
          className={loadingStatus()}
        >
          {t('loadingAccountStatus')}
        </span>
      </AccountSlot>
    );
  }

  if (sessionResult.status === 'authenticated') {
    const { name, email, image } = sessionResult.data.user ?? {};

    return (
      <AccountSlot>
        <AccountMenu
          panelId={panelId}
          isOpen={open}
          toggle={toggle}
          triggerRef={triggerRef}
          panelRef={panelRef}
          name={name}
          email={email}
          image={image}
        />
      </AccountSlot>
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
      oauthProviderIds={oauthProviderIds}
    />
  );
};
