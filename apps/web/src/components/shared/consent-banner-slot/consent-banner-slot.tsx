'use client';

import { ConsentBanner } from '@blog/ui/components/molecules/consent-banner';
import { CONSENT_STATUS } from '@web/constants/consent';
import { useConsentPreferences } from '@web/context/consent-preferences-provider';
import { useConsentStore } from '@web/hooks/use-consent-store';
import { useTranslations } from 'next-intl';

export interface IConsentBannerSlotProps {
  isEnabled: boolean;
}

export const ConsentBannerSlot = ({ isEnabled }: IConsentBannerSlotProps) => {
  const t = useTranslations('consent.banner');
  const { status, acceptAll, rejectAll } = useConsentStore();
  const { open } = useConsentPreferences();

  if (!isEnabled || status !== CONSENT_STATUS.UNANSWERED) return null;

  return (
    <ConsentBanner
      headingLevel={2}
      heading={t('heading')}
      message={t('message')}
      acceptLabel={t('acceptLabel')}
      rejectLabel={t('rejectLabel')}
      settingsLabel={t('settingsLabel')}
      onAccept={acceptAll}
      onReject={rejectAll}
      onOpenSettings={open}
      dataTestId="consent-banner"
    />
  );
};
