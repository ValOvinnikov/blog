'use client';

import { ConsentPreferences } from '@blog/ui/components/molecules/consent-preferences';
import { useConsentPreferences } from '@web/context/consent-preferences-provider';
import { useConsentPreferencesForm } from '@web/hooks/use-consent-preferences-form';
import { useTranslations } from 'next-intl';

export const ConsentPreferencesForm = () => {
  const t = useTranslations('consent.preferences');
  const { categories, values, setCategory, save } = useConsentPreferencesForm();
  const { close } = useConsentPreferences();

  const handleSave = () => {
    save();
    close();
  };

  return (
    <ConsentPreferences
      categories={categories}
      values={values}
      onCategoryChange={setCategory}
      saveLabel={t('saveLabel')}
      onSave={handleSave}
      closeLabel={t('closeLabel')}
      onClose={close}
      dataTestId="consent-preferences"
    />
  );
};
