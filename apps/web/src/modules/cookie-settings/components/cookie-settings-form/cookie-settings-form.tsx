'use client';

import type { TMaybeUndefined } from '@blog/config';
import { ConsentPreferences } from '@blog/ui/components/molecules/consent-preferences';
import { useConsentPreferencesForm } from '@web/hooks/use-consent-preferences-form';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { cookieSettingsFormVariants } from './cookie-settings-form-variants';

const s = cookieSettingsFormVariants();

export const CookieSettingsForm = () => {
  const t = useTranslations('consent.preferences');
  const { isReady, saveRevision, categories, values, setCategory, save } =
    useConsentPreferencesForm();
  const [ownSaveRevision, setOwnSaveRevision] =
    useState<TMaybeUndefined<number>>();
  const isSaved = ownSaveRevision === saveRevision;

  const handleCategoryChange = (id: string, checked: boolean) => {
    setCategory(id, checked);
    setOwnSaveRevision(undefined);
  };

  return (
    <div>
      {isReady && (
        <ConsentPreferences
          categories={categories}
          values={values}
          onCategoryChange={handleCategoryChange}
          saveLabel={t('saveLabel')}
          onSave={() => setOwnSaveRevision(save())}
          dataTestId="cookie-settings-form"
        />
      )}
      <p role="status" className={s.status()}>
        {isSaved && <span key={saveRevision}>{t('savedStatus')}</span>}
      </p>
    </div>
  );
};
