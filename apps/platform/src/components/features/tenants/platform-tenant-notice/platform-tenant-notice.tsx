import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { useTranslations } from 'next-intl';

export const PlatformTenantNotice = () => {
  const t = useTranslations('platformTenantNotice');
  const tRefusal = useTranslations('tenantLifecycleErrors');

  return (
    <Alert
      type={ALERT_TYPE.INFO}
      title={t('title')}
      description={tRefusal('platformTenant')}
    />
  );
};
