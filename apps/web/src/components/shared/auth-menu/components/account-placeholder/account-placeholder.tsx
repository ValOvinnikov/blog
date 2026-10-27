import type { IAccountControl } from '@blog/config';
import { authMenuVariants } from '@web/components/shared/auth-menu/auth-menu-variants';
import { AccountTriggers } from '@web/components/shared/auth-menu/components/account-triggers/account-triggers';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

export interface IAccountPlaceholderProps {
  accountControl: IAccountControl;
}

/** Holds the header's account slot at the chosen button's footprint until the session resolves. */
export const AccountPlaceholder = ({
  accountControl,
}: IAccountPlaceholderProps) => {
  const t = useTranslations('authMenu');
  const panelId = useId();
  const { slot, emptyOutline, loadingStatus } = authMenuVariants();

  return (
    <span className={slot()}>
      <span aria-hidden="true" inert={true} className={slot()}>
        <AccountTriggers
          accountControl={accountControl}
          user={undefined}
          isOpen={false}
          panelId={panelId}
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
