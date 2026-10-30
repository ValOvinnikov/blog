'use client';

import { SIZE } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { useConsentPreferences } from '@web/context/consent-preferences-provider';
import { useTranslations } from 'next-intl';

import { cookieSettingsButtonVariants } from './cookie-settings-button-variants';

const s = cookieSettingsButtonVariants();

export const CookieSettingsButton = () => {
  const t = useTranslations('consent');
  const { open, footerControlRef } = useConsentPreferences();

  return (
    <span ref={footerControlRef} className={s.root()}>
      <Button variant="link" size={SIZE.SM} onClick={open}>
        {t('footerSettingsLabel')}
      </Button>
    </span>
  );
};
