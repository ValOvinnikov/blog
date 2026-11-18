'use client';

import { Alert } from '@platform/components/shared/alert';
import { Card } from '@platform/components/shared/card';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import {
  hasGoogleAnalyticsId,
  withConsentBannerForGoogleAnalytics,
  type TFeaturesFormValues,
} from '@platform/utils/analytics-draft/analytics-draft';
import {
  SHOWN_CAPABILITY_TOGGLES,
  type TSettingsFeaturesValues,
} from '@platform/utils/settings-features-fields/settings-features-fields';
import {
  ALERT_TYPE,
  CAPABILITY,
  FORM_STATUS,
  type TCapability,
} from '@shinefold/config';
import { isUndefined } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { AnalyticsSettingRow } from './components/analytics-setting-row';
import { CapabilityToggleRow } from './components/capability-toggle-row';
import { useFeaturesForm } from './use-features-form';

export type TFeaturesSettingsProps = {
  tenantId: string;
  entitledCapabilities: readonly TCapability[];
  hasOwnAnalytics: boolean;
  initialValues: TFeaturesFormValues;
  savedAt?: Date;
  archivedAt?: Date;
};

// A locked control is only a courtesy; the Server Actions re-check the plan.
export const FeaturesSettings = ({
  tenantId,
  entitledCapabilities,
  hasOwnAnalytics,
  initialValues,
  savedAt,
  archivedAt,
}: TFeaturesSettingsProps) => {
  const t = useTranslations('featuresSettings');
  const analyticsIdFieldId = useId();
  const {
    values,
    setValues,
    status,
    isPending,
    isArchived,
    archivedNoticeId,
    form,
    analyticsFieldErrors,
    featuresFieldErrors,
    clearFieldErrors,
  } = useFeaturesForm({
    tenantId,
    initialValues,
    savedAt,
    archivedAt,
    analyticsIdFieldId,
  });

  const handleToggle = (
    field: keyof TSettingsFeaturesValues,
    checked: boolean,
  ) => {
    clearFieldErrors();
    setValues((prev) => ({ ...prev, [field]: checked }));
  };

  const consentBannerState = {
    requiredReason:
      hasOwnAnalytics && hasGoogleAnalyticsId(values)
        ? t('consentBannerRequiredNote')
        : undefined,
    error: featuresFieldErrors.consentBannerEnabled
      ? t('consentBannerRequiredError')
      : undefined,
  };

  return (
    <SettingsFormShell
      title={t('heading')}
      description={t('description')}
      form={form}
      errorTitle={status === FORM_STATUS.ERROR ? t('alertError') : undefined}
    >
      {!values.readerAccountsEnabled && (
        <Alert type={ALERT_TYPE.INFO} description={t('readerAccountNote')} />
      )}
      <Card>
        <Card.Header title={t('capabilitiesHeading')} />
        <Card.Body>
          {SHOWN_CAPABILITY_TOGGLES.map((toggle) => {
            const { capability, field, parentField } = toggle;

            if (capability === CAPABILITY.ANALYTICS) {
              return (
                <AnalyticsSettingRow
                  key={capability}
                  draft={values}
                  hasOwnAnalytics={hasOwnAnalytics}
                  idFieldId={analyticsIdFieldId}
                  isIdInvalid={Boolean(analyticsFieldErrors.analyticsId)}
                  onChange={({ analyticsProvider, analyticsId }) => {
                    clearFieldErrors();
                    setValues((prev) =>
                      withConsentBannerForGoogleAnalytics({
                        ...prev,
                        analyticsProvider,
                        analyticsId,
                      }),
                    );
                  }}
                />
              );
            }

            return (
              <CapabilityToggleRow
                key={capability}
                toggle={toggle}
                isEntitled={entitledCapabilities.includes(capability)}
                isChecked={values[field]}
                isDisabled={
                  isPending ||
                  (!isUndefined(parentField) && !values[parentField])
                }
                isArchived={isArchived}
                {...(capability === CAPABILITY.CONSENT_BANNER &&
                  consentBannerState)}
                describedBy={isArchived ? archivedNoticeId : undefined}
                onCheckedChange={(checked) => handleToggle(field, checked)}
              />
            );
          })}
        </Card.Body>
      </Card>
    </SettingsFormShell>
  );
};
