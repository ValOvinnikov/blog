import { GrantLanguagesControl } from '@platform/components/features/entitlement-grants/grant-languages-control';
import { Alert } from '@platform/components/shared/alert';
import type { TGrantTarget } from '@platform/utils/grant-target/grant-target';
import { ALERT_TYPE, type TMaybeUndefined } from '@shinefold/config';
import { useTranslations } from 'next-intl';

export type TLanguagesLimitNoticeProps = {
  allowed: number;
  storedCount: number;
  grantTarget: TMaybeUndefined<TGrantTarget>;
};

export const LanguagesLimitNotice = ({
  allowed,
  storedCount,
  grantTarget,
}: TLanguagesLimitNoticeProps) => {
  const t = useTranslations('languagesSettings');
  const isDefaultOnly = allowed === 0;
  const description = isDefaultOnly
    ? t('upgradeNotice')
    : storedCount > allowed
      ? t('downgradeNotice', { allowed, stored: storedCount })
      : undefined;

  if (!description) return null;

  return (
    <Alert
      type={ALERT_TYPE.INFO}
      title={t('noticeTitle')}
      description={description}
      action={
        isDefaultOnly &&
        grantTarget && <GrantLanguagesControl target={grantTarget} />
      }
    />
  );
};
