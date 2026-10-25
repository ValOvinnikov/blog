'use client';

import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { SESSION_STATUS } from '@web/constants/session';
import { ACCOUNT_OVERLAY_ID } from '@web/context/header-overlay-provider';
import { useOAuthErrorParam } from '@web/hooks/use-oauth-error-param';
import { usePopover } from '@web/hooks/use-popover';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { authMenuVariants } from './auth-menu-variants';
import { AccountMenu } from './components/account-menu/account-menu';
import { AccountPlaceholder } from './components/account-placeholder/account-placeholder';
import { SignInMenu } from './components/sign-in-menu/sign-in-menu';
import { useSignedInHint } from './hooks/use-signed-in-hint';

export interface IAuthMenuProps {
  oauthProviderIds: readonly TOAuthProviderId[];
}

export const AuthMenu = ({ oauthProviderIds }: IAuthMenuProps) => {
  const { status, data } = useSession();
  const oauthError = useOAuthErrorParam();
  const t = useTranslations('authMenu');
  const panelId = useId();
  const { open, toggle, triggerRef, panelRef } = usePopover({
    overlayId: ACCOUNT_OVERLAY_ID,
  });
  const { loadingStatus, reveal } = authMenuVariants();
  useSignedInHint(status, data?.expires);

  if (status === SESSION_STATUS.LOADING) {
    return (
      <AccountPlaceholder>
        <span
          role="status"
          aria-label={t('loadingAccountStatus')}
          className={loadingStatus()}
        >
          {t('loadingAccountStatus')}
        </span>
      </AccountPlaceholder>
    );
  }

  if (status === SESSION_STATUS.AUTHENTICATED) {
    const { name, email, image } = data.user ?? {};

    return (
      <span className={reveal()}>
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
      </span>
    );
  }

  return (
    <span className={reveal()}>
      <SignInMenu
        panelId={panelId}
        isOpen={open}
        toggle={toggle}
        triggerRef={triggerRef}
        panelRef={panelRef}
        oauthError={oauthError}
        oauthProviderIds={oauthProviderIds}
      />
    </span>
  );
};
