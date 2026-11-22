'use client';

import { useSettingsForm } from '@platform/components/shared/settings-form-shell';
import { SUPPORTED_LOCALES } from '@platform/constants/language';
import { useToast } from '@platform/context/toast-provider';
import {
  updateTenantLanguagesAction,
  type TUpdateTenantLanguagesResult,
} from '@platform/server/tenants/update-tenant-languages-action';
import { additionalLocalesToSave } from '@platform/utils/additional-locales-to-save/additional-locales-to-save';
import type { TLocaleIsoCode } from '@shinefold/config';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useLanguageDraftFields } from './use-language-draft-fields';

type TUseLanguagesFormArgs = {
  tenantId: string;
  defaultLocale: TLocaleIsoCode;
  stored: TLocaleIsoCode[];
  live: TLocaleIsoCode[];
  additionalLocaleLimit: number;
  savedAt?: Date;
  archivedAt?: Date;
};

export const useLanguagesForm = ({
  tenantId,
  defaultLocale,
  stored,
  live,
  additionalLocaleLimit,
  savedAt,
  archivedAt,
}: TUseLanguagesFormArgs) => {
  const t = useTranslations('languagesSettings');
  const toast = useToast();
  const router = useRouter();
  const [savedLocales, setSavedLocales] = useState(stored);
  const draftFields = useLanguageDraftFields(defaultLocale);
  const isOverLimit = savedLocales.length > additionalLocaleLimit;

  const settingsForm = useSettingsForm<
    TLocaleIsoCode[],
    TUpdateTenantLanguagesResult
  >({
    initialValues: live,
    archivedAt,
    onSubmit: (liveLocales) =>
      updateTenantLanguagesAction(
        tenantId,
        additionalLocalesToSave(liveLocales, savedLocales, isOverLimit),
      ),
    onSuccess: (liveLocales) => {
      setSavedLocales(
        additionalLocalesToSave(liveLocales, savedLocales, isOverLimit),
      );
      toast.success({ message: t('alertSuccess') });
      router.refresh();
    },
    countChanges: (liveLocales, savedLiveLocales) =>
      SUPPORTED_LOCALES.filter(
        (locale) =>
          liveLocales.includes(locale) !== savedLiveLocales.includes(locale),
      ).length,
    planRefusalMessageKey: 'languagesNotInPlan',
    draft: {
      tenantId,
      page: 'languages',
      savedAt,
      fields: draftFields,
    },
  });

  return { ...settingsForm, savedLocales, isOverLimit };
};
