import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { GrowthBadge } from '@platform/components/shared/growth-badge';
import { useTranslations } from 'next-intl';

export const SignInAppsGrowthNote = () => {
  const t = useTranslations('signInAppsPage');

  return (
    <Alert
      type={ALERT_TYPE.INFO}
      role="note"
      title={t('growthNoteTitle')}
      description={t.rich('growthNoteDescription', {
        badge: () => <GrowthBadge />,
      })}
    />
  );
};
