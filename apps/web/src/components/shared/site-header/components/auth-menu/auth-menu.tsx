'use client';

import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import type { IAccountControl } from '@blog/config';
import { PopoverMenu } from '@blog/ui/components/molecules/popover-menu';
import {
  ReaderAccountPanel,
  useReaderAccount,
} from '@web/components/shared/reader-account-panel';
import { ReaderSignInPanel } from '@web/components/shared/reader-sign-in-panel';
import { SESSION_STATUS } from '@web/constants/session';
import { ACCOUNT_OVERLAY_ID } from '@web/context/header-overlay-provider';
import { useOAuthErrorParam } from '@web/hooks/use-oauth-error-param';
import { usePopover } from '@web/hooks/use-popover';
import { useTranslations } from 'next-intl';

import { authMenuVariants } from './auth-menu-variants';
import { AccountPlaceholder } from './components/account-placeholder/account-placeholder';
import { AccountTriggers } from './components/account-triggers/account-triggers';
import { useSignedInHint } from './use-signed-in-hint';

export interface IAuthMenuProps {
  oauthProviderIds: readonly TOAuthProviderId[];
  accountControl: IAccountControl;
  hasBookmarks: boolean;
  hasReaderAccounts: boolean;
}

export const AuthMenu = ({
  oauthProviderIds,
  accountControl,
  hasBookmarks,
  hasReaderAccounts,
}: IAuthMenuProps) => {
  const { status, expires, user, onImageError } = useReaderAccount();
  const oauthError = useOAuthErrorParam();
  const t = useTranslations('authMenu');
  const popover = usePopover({ overlayId: ACCOUNT_OVERLAY_ID });
  const { panel, reveal, errorNotice } = authMenuVariants();
  useSignedInHint(status, expires);

  if (status === SESSION_STATUS.LOADING) {
    return (
      <AccountPlaceholder
        accountControl={accountControl}
        isSignedInHintRequired={!hasReaderAccounts}
      />
    );
  }

  if (!user && !hasReaderAccounts) {
    return null;
  }

  return (
    <span className={reveal()}>
      <PopoverMenu>
        <AccountTriggers
          accountControl={accountControl}
          user={user}
          onImageError={onImageError}
          popover={popover}
        />
        {user ? (
          <ReaderAccountPanel
            appearance={accountControl.panelStyle}
            user={user}
            onImageError={onImageError}
            hasBookmarks={hasBookmarks}
            panel={popover}
            className={panel()}
          />
        ) : (
          <ReaderSignInPanel
            panel={popover}
            oauthProviderIds={oauthProviderIds}
            className={panel()}
          />
        )}
        {!user && Boolean(oauthError) && !popover.open && (
          <p role="alert" className={errorNotice()}>
            {t('oauthError')}
          </p>
        )}
      </PopoverMenu>
    </span>
  );
};
