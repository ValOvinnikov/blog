'use client';

import { Dialog } from '@blog/ui/components/organisms/dialog';
import { useConsentPreferences } from '@web/context/consent-preferences-provider';
import { useTranslations } from 'next-intl';

import { ConsentPreferencesForm } from './components/consent-preferences-form/consent-preferences-form';

export const ConsentPreferencesDialog = () => {
  const t = useTranslations('consent.preferences');
  const { isOpen, open, close, settingsButtonRef } = useConsentPreferences();

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(nextIsOpen) => (nextIsOpen ? open() : close())}
      heading={t('heading')}
      headingLevel={2}
      fallbackFocusRef={settingsButtonRef}
      dataTestId="consent-preferences-dialog"
    >
      <ConsentPreferencesForm />
    </Dialog>
  );
};
