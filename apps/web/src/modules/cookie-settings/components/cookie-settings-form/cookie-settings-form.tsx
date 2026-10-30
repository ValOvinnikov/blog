'use client';

import { ConsentPreferences } from '@blog/ui/components/molecules/consent-preferences';
import { useConsentPreferencesForm } from '@web/hooks/use-consent-preferences-form';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { cookieSettingsFormVariants } from './cookie-settings-form-variants';

const s = cookieSettingsFormVariants();

export const CookieSettingsForm = () => {
  const t = useTranslations('consent.preferences');
  const { isReady, categories, values, setCategory, save } =
    useConsentPreferencesForm();
  const [isSaved, setIsSaved] = useState(false);

  const handleCategoryChange = (id: string, checked: boolean) => {
    setCategory(id, checked);
    setIsSaved(false);
  };

  const handleSave = () => {
    save();
    setIsSaved(true);
  };

  return (
    <div className={s.root()}>
      {isReady && (
        <ConsentPreferences
          categories={categories}
          values={values}
          onCategoryChange={handleCategoryChange}
          saveLabel={t('saveLabel')}
          onSave={handleSave}
          dataTestId="cookie-settings-form"
        />
      )}
      <p role="status" className={s.status()}>
        {isSaved ? t('savedStatus') : ''}
      </p>
    </div>
  );
};
