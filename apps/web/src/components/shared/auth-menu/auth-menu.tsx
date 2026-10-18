'use client';

import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { Spinner } from '@blog/ui/components/atoms/spinner';
import { useOAuthErrorParam } from '@web/hooks/use-oauth-error-param';
import { usePopover } from '@web/hooks/use-popover';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { authMenuVariants } from './auth-menu-variants';
import { AccountMenu } from './components/account-menu/account-menu';
import { SignInMenu } from './components/sign-in-menu/sign-in-menu';

export interface IAuthMenuProps {
  oauthProviderIds: readonly TOAuthProviderId[];
}

export const AuthMenu = ({ oauthProviderIds }: IAuthMenuProps) => {
  const sessionResult = useSession();
  const oauthError = useOAuthErrorParam();
  const t = useTranslations('authMenu');
  const panelId = useId();
  const { open, toggle, triggerRef, panelRef } = usePopover();
  const { statusIndicator } = authMenuVariants();

  if (sessionResult.status === 'loading') {
    return (
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
      oauthProviderIds={oauthProviderIds}
    />
  );
};
