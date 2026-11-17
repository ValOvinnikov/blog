'use client';

import { useSettingsForm } from '@platform/components/shared/settings-form-shell';
import type { TAnalyticsFieldErrorReason } from '@platform/constants/settings-features';
import { useToast } from '@platform/context/toast-provider';
import {
  updateAnalyticsAction,
  type TUpdateAnalyticsResult,
} from '@platform/server/settings-features/update-analytics-action';
import {
  updateFeaturesAction,
  type TUpdateFeaturesResult,
} from '@platform/server/settings-features/update-features-action';
import {
  countAnalyticsChanges,
  splitFeaturesFormValues,
  type TFeaturesFormValues,
} from '@platform/utils/analytics-draft/analytics-draft';
import { CAPABILITY_TOGGLES } from '@platform/utils/settings-features-fields/settings-features-fields';
import {
  ACTION_OUTCOME,
  isOutcomeInvalid,
  isOutcomeSuccess,
  type TFieldErrors,
} from '@shinefold/config';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useFeaturesDraftFields } from './use-features-draft-fields';

type TUseFeaturesFormArgs = {
  tenantId: string;
  initialValues: TFeaturesFormValues;
  savedAt?: Date;
  archivedAt?: Date;
  analyticsIdFieldId: string;
};

const countToggleChanges = (
  values: TFeaturesFormValues,
  savedValues: TFeaturesFormValues,
): number =>
  CAPABILITY_TOGGLES.filter(({ field }) => values[field] !== savedValues[field])
    .length;

const countChanges = (
  values: TFeaturesFormValues,
  savedValues: TFeaturesFormValues,
): number =>
  countToggleChanges(values, savedValues) +
  countAnalyticsChanges(values, savedValues);

export const useFeaturesForm = ({
  tenantId,
  initialValues,
  savedAt,
  archivedAt,
  analyticsIdFieldId,
}: TUseFeaturesFormArgs) => {
  const t = useTranslations('featuresSettings');
  const toast = useToast();
  const router = useRouter();
  const [analyticsFieldErrors, setAnalyticsFieldErrors] = useState<
    TFieldErrors<'analyticsId', TAnalyticsFieldErrorReason>
  >({});

  const settings = useSettingsForm<
    TFeaturesFormValues,
    TUpdateFeaturesResult | TUpdateAnalyticsResult
  >({
    initialValues,
    archivedAt,
    invalidControls: () => ({
      ids: analyticsFieldErrors.analyticsId ? [analyticsIdFieldId] : [],
    }),
    onDiscard: () => setAnalyticsFieldErrors({}),
    onSubmit: async (values) => {
      const { savedValues, setSavedValues } = settings;
      const { features, analytics } = splitFeaturesFormValues(values);
      let saved = savedValues;

      if (countAnalyticsChanges(values, savedValues) > 0) {
        const result = await updateAnalyticsAction(tenantId, analytics);
        setAnalyticsFieldErrors(
          isOutcomeInvalid(result) ? result.fieldErrors : {},
        );
        if (!isOutcomeSuccess(result)) return result;
        saved = { ...saved, ...analytics };
      }

      if (countToggleChanges(values, savedValues) > 0) {
        const result = await updateFeaturesAction(tenantId, features);
        if (!isOutcomeSuccess(result)) {
          setSavedValues(saved);
          return result;
        }
      }

      return toOutcome(ACTION_OUTCOME.SUCCESS);
    },
    onSuccess: () => {
      toast.success({ message: t('alertSuccess') });
      router.refresh();
    },
    countChanges,
    draft: {
      tenantId,
      page: 'features',
      savedAt,
      fields: useFeaturesDraftFields(),
    },
  });

  return {
    ...settings,
    analyticsFieldErrors,
    clearAnalyticsFieldErrors: () => setAnalyticsFieldErrors({}),
  };
};
