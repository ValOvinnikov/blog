'use client';

import { CONSENT_CATEGORY } from '@blog/config';
import { ConsentPreferences } from '@blog/ui/components/molecules/consent-preferences';
import {
  useConsentChoices,
  useConsentPreferences,
} from '@web/context/consent-provider';
import { OPTIONAL_CONSENT_CATEGORIES } from '@web/utils/consent-cookie';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export const ConsentPreferencesForm = () => {
  const t = useTranslations('consent');
  const { granted, save } = useConsentChoices();
  const { closePreferences } = useConsentPreferences();
  const [values, setValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      OPTIONAL_CONSENT_CATEGORIES.map((category) => [
        category,
        granted.includes(category),
      ]),
    ),
  );

  const categories = [
    {
      id: CONSENT_CATEGORY.NECESSARY,
      label: t('categories.necessary.label'),
      description: t('categories.necessary.description'),
      isLocked: true,
    },
    {
      id: CONSENT_CATEGORY.EXTERNAL_MEDIA,
      label: t('categories.externalMedia.label'),
      description: t('categories.externalMedia.description'),
    },
  ];

  const handleSave = () => {
    save(OPTIONAL_CONSENT_CATEGORIES.filter((category) => values[category]));
    closePreferences();
  };

  return (
    <ConsentPreferences
      headingLevel={2}
      heading={t('preferences.heading')}
      categories={categories}
      values={values}
      onCategoryChange={(id, checked) =>
        setValues((current) => ({ ...current, [id]: checked }))
      }
      saveLabel={t('preferences.saveLabel')}
      onSave={handleSave}
      closeLabel={t('preferences.closeLabel')}
      onClose={closePreferences}
      dataTestId="consent-preferences"
    />
  );
};
