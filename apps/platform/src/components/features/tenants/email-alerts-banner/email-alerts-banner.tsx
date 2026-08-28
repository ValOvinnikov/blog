import { BannerState } from '@platform/components/shared/banner-state';
import { useTranslations } from 'next-intl';

/**
 * Surfaces the "operator email alerts are unconfigured" state that would
 * otherwise only appear in the recheck sweep's own logs — see
 * `getDomainVerificationStatus` for the same not-configured-in-the-UI
 * precedent for a different channel.
 */
export const EmailAlertsBanner = () => {
  const t = useTranslations('emailAlertsBanner');

  return (
    <BannerState
      tone="warn"
      role="status"
      title={t('title')}
      description={t('description')}
      action={null}
    />
  );
};
