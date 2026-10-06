'use client';

import { ConsentBanner } from '@blog/ui/components/molecules/consent-banner';
import {
  useConsentChoices,
  useConsentPreferences,
} from '@web/context/consent-provider';
import { useTranslations } from 'next-intl';

export interface IConsentBannerSlotProps {
  isEnabled: boolean;
}

export const ConsentBannerSlot = ({ isEnabled }: IConsentBannerSlotProps) => {
  const t = useTranslations('consent.banner');
  const { status, acceptAll, rejectAll } = useConsentChoices();
  const { openPreferences } = useConsentPreferences();

  if (!isEnabled || status !== 'unanswered') return null;

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
      onOpenSettings={openPreferences}
      dataTestId="consent-banner"
    />
  );
};
