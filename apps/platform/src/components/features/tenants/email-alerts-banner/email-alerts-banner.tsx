import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { useTranslations } from 'next-intl';

export const EmailAlertsBanner = () => {
  const t = useTranslations('emailAlertsBanner');

  return (
    <Alert
      type={ALERT_TYPE.WARNING}
      title={t('title')}
      description={t('description')}
    />
  );
};
