'use client';

import { SIZE } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { useConsentPreferences } from '@web/context/consent-provider';
import { useTranslations } from 'next-intl';

export const CookieSettingsButton = () => {
  const t = useTranslations('consent');
  const { openPreferences } = useConsentPreferences();

  return (
    <Button variant="link" size={SIZE.SM} onClick={openPreferences}>
      {t('footerSettingsLabel')}
    </Button>
  );
};
