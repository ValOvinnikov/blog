'use client';

import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import type { IAccountControl } from '@blog/config';
import { PopoverMenu } from '@blog/ui/components/molecules/popover-menu';
import { SESSION_STATUS } from '@web/constants/session';
import { ACCOUNT_OVERLAY_ID } from '@web/context/header-overlay-provider';
import { useOAuthErrorParam } from '@web/hooks/use-oauth-error-param';
import { usePopover } from '@web/hooks/use-popover';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { authMenuVariants } from './auth-menu-variants';
import { AccountPlaceholder } from './components/account-placeholder/account-placeholder';
import { AccountTriggers } from './components/account-triggers/account-triggers';
import { ReaderAccountPanel } from './components/reader-account-panel/reader-account-panel';
import { ReaderSignInPanel } from './components/reader-sign-in-panel/reader-sign-in-panel';
import { useReaderAccount } from './hooks/use-reader-account';
import { useSignedInHint } from './hooks/use-signed-in-hint';

export interface IAuthMenuProps {
  oauthProviderIds: readonly TOAuthProviderId[];
  accountControl: IAccountControl;
}

export const AuthMenu = ({
  oauthProviderIds,
  accountControl,
}: IAuthMenuProps) => {
  const { status, expires, user, onImageError } = useReaderAccount();
  const oauthError = useOAuthErrorParam();
  const t = useTranslations('authMenu');
  const panelId = useId();
  const { open, toggle, triggerRef, panelRef } = usePopover({
    overlayId: ACCOUNT_OVERLAY_ID,
  });
  const { panel, reveal, errorNotice } = authMenuVariants();
  useSignedInHint(status, expires);

  if (status === SESSION_STATUS.LOADING) {
    return <AccountPlaceholder accountControl={accountControl} />;
  }

  return (
    <span className={reveal()}>
      <PopoverMenu>
        <AccountTriggers
          accountControl={accountControl}
          user={user}
          onImageError={onImageError}
          isOpen={open}
          panelId={panelId}
          triggerRef={triggerRef}
          onToggle={toggle}
        />
        {user ? (
          <ReaderAccountPanel
            appearance={accountControl.panelStyle}
            user={user}
            onImageError={onImageError}
            panelId={panelId}
            isOpen={open}
            panelRef={panelRef}
            className={panel()}
          />
        ) : (
          <ReaderSignInPanel
            panelId={panelId}
            isOpen={open}
            panelRef={panelRef}
            oauthProviderIds={oauthProviderIds}
            className={panel()}
          />
        )}
        {!user && Boolean(oauthError) && !open && (
          <p role="alert" className={errorNotice()}>
            {t('oauthError')}
          </p>
        )}
      </PopoverMenu>
    </span>
  );
};
