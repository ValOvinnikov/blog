'use client';

import {
  CONSENT_CATEGORY,
  type TConsentCategory,
  type TMaybeUndefined,
} from '@blog/config';
import type { IConsentCategory } from '@blog/ui/components/molecules/consent-preferences';
import { CONSENT_STATUS } from '@web/constants/consent';
import { useConsentStore } from '@web/hooks/use-consent-store';
import { OPTIONAL_CONSENT_CATEGORIES } from '@web/utils/consent-cookie';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type TConsentValues = Record<string, boolean>;

type TConsentDraft = {
  saveRevision: number;
  values: TConsentValues;
};

const toValues = (granted: readonly TConsentCategory[]): TConsentValues =>
  Object.fromEntries(
    OPTIONAL_CONSENT_CATEGORIES.map((category) => [
      category,
      granted.includes(category),
    ]),
  );

export const useConsentPreferencesForm = () => {
  const t = useTranslations('consent');
  const { status, granted, saveRevision, save } = useConsentStore();
  const [draft, setDraft] = useState<TMaybeUndefined<TConsentDraft>>();

  const values =
    draft?.saveRevision === saveRevision ? draft.values : toValues(granted);

  const categories: IConsentCategory[] = [
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

  const setCategory = (id: string, checked: boolean) =>
    setDraft({ saveRevision, values: { ...values, [id]: checked } });

  const saveValues = () =>
    save(OPTIONAL_CONSENT_CATEGORIES.filter((category) => values[category]));

  return {
    isReady: status !== CONSENT_STATUS.UNKNOWN,
    saveRevision,
    categories,
    values,
    setCategory,
    save: saveValues,
  };
};
