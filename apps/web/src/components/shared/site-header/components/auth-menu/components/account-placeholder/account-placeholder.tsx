import type { IAccountControl } from '@blog/config';
import { authMenuVariants } from '@web/components/shared/site-header/components/auth-menu/auth-menu-variants';
import { AccountTriggers } from '@web/components/shared/site-header/components/auth-menu/components/account-triggers/account-triggers';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

export interface IAccountPlaceholderProps {
  accountControl: IAccountControl;
  isSignedInHintRequired: boolean;
}

export const AccountPlaceholder = ({
  accountControl,
  isSignedInHintRequired,
}: IAccountPlaceholderProps) => {
  const t = useTranslations('authMenu');
  const panelId = useId();
  const { slot, emptyOutline, loadingStatus } = authMenuVariants({
    isSignedInHintRequired,
  });

  return (
    <span className={slot()}>
      <span aria-hidden="true" inert={true} className={slot()}>
        <AccountTriggers
          accountControl={accountControl}
          user={undefined}
          popover={{ open: false, panelId }}
          className={emptyOutline()}
        />
      </span>
      <span
        role="status"
        aria-label={t('loadingAccountStatus')}
        className={loadingStatus()}
      >
        {t('loadingAccountStatus')}
      </span>
    </span>
  );
};
