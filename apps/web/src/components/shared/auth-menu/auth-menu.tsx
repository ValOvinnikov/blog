'use client';

import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { IconButton } from '@blog/ui/components/atoms/icon-button';
import { headerControlVariants } from '@web/components/shared/header-control';
import { useOAuthErrorParam } from '@web/hooks/use-oauth-error-param';
import { usePopover } from '@web/hooks/use-popover';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { authMenuVariants } from './auth-menu-variants';
import { AccountMenu } from './components/account-menu/account-menu';
import { SignInLabel } from './components/sign-in-label/sign-in-label';
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
  const { loading, loadingPlaceholder, loadingStatus, signInTrigger } =
    authMenuVariants();

  if (sessionResult.status === 'loading') {
    return (
      <span className={loading()}>
        <span
          role="status"
          aria-label={t('loadingAccountStatus')}
          className={loadingStatus()}
        >
          {t('loadingAccountStatus')}
        </span>
        <span aria-hidden="true">
          <IconButton
            variant="bordered"
            ariaLabel={t('signIn')}
            isInert={true}
            className={headerControlVariants({
              class: [signInTrigger(), loadingPlaceholder()],
            })}
          >
            <SignInLabel />
          </IconButton>
        </span>
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
