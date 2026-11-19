'use client';

import { CONSENT_CATEGORY, routes } from '@shinefold/config';
import { ConsentBanner } from '@shinefold/ui/components/molecules/consent-banner';
import { SmartLink } from '@web/components/shared/smart-link';
import { CONSENT_STATUS } from '@web/constants/consent';
import { useConsentPreferences } from '@web/context/consent-preferences-provider';
import { useConsentStore } from '@web/hooks/use-consent-store';
import { useOfferedConsentCategories } from '@web/hooks/use-offered-consent-categories';
import { useTranslations } from 'next-intl';

export interface IConsentBannerSlotProps {
  isEnabled: boolean;
}

export const ConsentBannerSlot = ({ isEnabled }: IConsentBannerSlotProps) => {
  const t = useTranslations('consent.banner');
  const { status, save, rejectAll } = useConsentStore();
  const offeredCategories = useOfferedConsentCategories();
  const { open } = useConsentPreferences();
  const offersAnalytics = offeredCategories.includes(
    CONSENT_CATEGORY.ANALYTICS,
  );

  if (!isEnabled || status !== CONSENT_STATUS.UNANSWERED) return null;

  return (
    <ConsentBanner
      heading={t('heading')}
      message={t(offersAnalytics ? 'messageWithAnalytics' : 'message')}
      policyLink={{
        href: routes.cookieStatement(),
        label: t('policyLinkLabel'),
      }}
      linkAs={SmartLink}
      labels={{
        accept: t('acceptLabel'),
        reject: t('rejectLabel'),
        settings: t('settingsLabel'),
      }}
      onAccept={() => save(offeredCategories)}
      onReject={rejectAll}
      onOpenSettings={open}
      dataTestId="consent-banner"
    />
  );
};
