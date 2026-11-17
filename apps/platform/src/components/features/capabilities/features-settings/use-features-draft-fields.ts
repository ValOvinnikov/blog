'use client';

import type { TFeaturesFormValues } from '@platform/utils/analytics-draft/analytics-draft';
import type { TSettingsDraftField } from '@platform/utils/settings-draft-offer/settings-draft-offer';
import { CAPABILITY_TOGGLES } from '@platform/utils/settings-features-fields/settings-features-fields';
import { CAPABILITY } from '@shinefold/config';
import { useTranslations } from 'next-intl';

export const useFeaturesDraftFields =
  (): TSettingsDraftField<TFeaturesFormValues>[] => {
    const t = useTranslations('featuresSettings');

    const toggleFields = CAPABILITY_TOGGLES.filter(
      ({ capability, isComingSoon }) =>
        !isComingSoon && capability !== CAPABILITY.ANALYTICS,
    ).map(({ capability, field }) => ({
      id: field,
      label: t(`toggleLabel.${capability}`),
      display: (values: TFeaturesFormValues) =>
        values[field] ? t('switchOn') : t('switchOff'),
    }));

    return [
      ...toggleFields,
      {
        id: 'analyticsProvider',
        label: t('analyticsProviderLabel'),
        display: ({ analyticsProvider }) =>
          t(`analyticsProviderOption.${analyticsProvider}`),
      },
      {
        id: 'analyticsId',
        label: t('analyticsIdDraftLabel'),
        display: ({ analyticsId }) => analyticsId || t('analyticsIdEmpty'),
      },
    ];
  };
