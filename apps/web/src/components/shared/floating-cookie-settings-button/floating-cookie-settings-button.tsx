'use client';

import { ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { IconButton } from '@blog/ui/components/atoms/icon-button';
import { tv } from '@blog/ui/lib/styling';
import { CONSENT_STATUS } from '@web/constants/consent';
import { useConsentPreferences } from '@web/context/consent-preferences-provider';
import { useHeaderOverlay } from '@web/context/header-overlay-provider';
import { useConsentStore } from '@web/hooks/use-consent-store';
import { useTranslations } from 'next-intl';

const floatingCookieSettingsButtonVariants = tv({
  base: ['fixed bottom-6 left-6 z-20', 'bg-surface shadow-float'],
});

export const FloatingCookieSettingsButton = () => {
  const t = useTranslations('consent');
  const { status } = useConsentStore();
  const { open, floatingControlRef } = useConsentPreferences();
  const hasOpenHeaderOverlay = Boolean(useHeaderOverlay()?.openOverlays.length);

  if (status !== CONSENT_STATUS.ANSWERED || hasOpenHeaderOverlay) return null;

  return (
    <IconButton
      ref={floatingControlRef}
      variant="circle"
      ariaLabel={t('footerSettingsLabel')}
      title={t('footerSettingsLabel')}
      onClick={open}
      className={floatingCookieSettingsButtonVariants()}
      dataTestId="floating-cookie-settings-button"
    >
      <Icon name={ICONS.COOKIE} size={SIZE.SM} />
    </IconButton>
  );
};
