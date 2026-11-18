'use client';

import {
  CONSENT_CATEGORY,
  type TConsentCategory,
  type TMaybeUndefined,
} from '@shinefold/config';
import type { IConsentCategory } from '@shinefold/ui/components/molecules/consent-preferences';
import { CONSENT_STATUS } from '@web/constants/consent';
import { useConsentStore } from '@web/hooks/use-consent-store';
import { useOfferedConsentCategories } from '@web/hooks/use-offered-consent-categories';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type TConsentValues = Record<string, boolean>;

type TConsentDraft = {
  saveRevision: number;
  values: TConsentValues;
};

const toValues = (
  offered: readonly TConsentCategory[],
  granted: readonly TConsentCategory[],
): TConsentValues =>
  Object.fromEntries(
    offered.map((category) => [category, granted.includes(category)]),
  );

export const useConsentPreferencesForm = () => {
  const t = useTranslations('consent');
  const { status, granted, saveRevision, save } = useConsentStore();
  const offeredCategories = useOfferedConsentCategories();
  const [draft, setDraft] = useState<TMaybeUndefined<TConsentDraft>>();

  const values =
    draft?.saveRevision === saveRevision
      ? draft.values
      : toValues(offeredCategories, granted);

  const optionalCategories = [
    {
      id: CONSENT_CATEGORY.ANALYTICS,
      label: t('categories.analytics.label'),
      description: t('categories.analytics.description'),
    },
    {
      id: CONSENT_CATEGORY.EXTERNAL_MEDIA,
      label: t('categories.externalMedia.label'),
      description: t('categories.externalMedia.description'),
    },
  ].filter(({ id }) => offeredCategories.includes(id));

  const categories: IConsentCategory[] = [
    {
      id: CONSENT_CATEGORY.NECESSARY,
      label: t('categories.necessary.label'),
      description: t('categories.necessary.description'),
      isLocked: true,
    },
    ...optionalCategories,
  ];

  const setCategory = (id: string, checked: boolean) =>
    setDraft({ saveRevision, values: { ...values, [id]: checked } });

  const saveValues = () =>
    save(offeredCategories.filter((category) => values[category]));

  return {
    isReady: status !== CONSENT_STATUS.UNKNOWN,
    saveRevision,
    categories,
    values,
    setCategory,
    save: saveValues,
  };
};
