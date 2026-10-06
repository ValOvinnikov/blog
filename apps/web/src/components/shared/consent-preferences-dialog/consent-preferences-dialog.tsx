'use client';

import { useConsentPreferences } from '@web/context/consent-provider';
import { useTranslations } from 'next-intl';

import { ConsentPreferencesForm } from './components/consent-preferences-form/consent-preferences-form';
import { consentPreferencesDialogVariants } from './consent-preferences-dialog-variants';
import { useModalDialog } from './use-modal-dialog';

const s = consentPreferencesDialogVariants();

export const ConsentPreferencesDialog = () => {
  const t = useTranslations('consent.preferences');
  const { isPreferencesOpen, closePreferences, settingsTriggerRef } =
    useConsentPreferences();
  const dialogRef = useModalDialog(isPreferencesOpen, settingsTriggerRef);

  return (
    <dialog
      ref={dialogRef}
      aria-label={t('heading')}
      onClose={closePreferences}
      className={s.root()}
      data-testid="consent-preferences-dialog"
    >
      {isPreferencesOpen && <ConsentPreferencesForm />}
    </dialog>
  );
};
