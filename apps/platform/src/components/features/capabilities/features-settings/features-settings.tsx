'use client';

import type { TCapability } from '@blog/config';
import { Card } from '@platform/components/shared/card';
import { SettingRow } from '@platform/components/shared/setting-row';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Switch } from '@platform/components/shared/switch';
import { useToast } from '@platform/context/toast-provider';
import {
  CAPABILITY_TOGGLES,
  type TSettingsFeaturesValues,
} from '@platform/utils/settings-features-fields/settings-features-fields';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

const countChanges = (
  a: TSettingsFeaturesValues,
  b: TSettingsFeaturesValues,
): number =>
  CAPABILITY_TOGGLES.filter(({ field }) => a[field] !== b[field]).length;

export type TFeaturesSettingsProps = {
  tenantId: string;
  entitledCapabilities: TCapability[];
  initialValues: TSettingsFeaturesValues;
  saveAction: (
    tenantId: string,
    values: TSettingsFeaturesValues,
  ) => Promise<{ ok: boolean }>;
  savedAt?: Date;
  archivedAt?: Date;
};

// A capability outside the plan is shown locked rather than hidden; the Server
// Action re-checks entitlement, so the disabled switch is only a courtesy.
export const FeaturesSettings = ({
  tenantId,
  entitledCapabilities,
  initialValues,
  saveAction,
  savedAt,
  archivedAt,
}: TFeaturesSettingsProps) => {
  const isArchived = Boolean(archivedAt);
  const archivedNoticeId = useId();
  const t = useTranslations('featuresSettings');
  const toast = useToast();
  const router = useRouter();
  const [savedValues, setSavedValues] =
    useState<TSettingsFeaturesValues>(initialValues);
  const { values, setValues, status, isPending, handleSubmit } =
    useFormSubmission<TSettingsFeaturesValues, { ok: boolean }>({
      initialValues,
      onSubmit: (vals) => saveAction(tenantId, vals),
      onSuccess: (submittedValues) => {
        setSavedValues(submittedValues);
        toast.success({
          message: t('alertSuccess'),
        });
        router.refresh();
      },
    });

  const changeCount = countChanges(values, savedValues);

  const handleToggle = (
    field: keyof TSettingsFeaturesValues,
    checked: boolean,
  ) => {
    setValues((prev) => ({ ...prev, [field]: checked }));
  };

  return (
    <SettingsFormShell
      title={t('heading')}
      description={t('description')}
      saveButtonLabel={t('saveButton')}
      savingButtonLabel={t('savingButton')}
      onSave={handleSubmit}
      onDiscard={() => setValues(savedValues)}
      changeCount={changeCount}
      isPending={isPending}
      archivedAt={archivedAt}
      archivedNoticeId={archivedNoticeId}
      hasError={status === 'error'}
      errorTitle={t('alertError')}
      draft={{
        tenantId,
        page: 'features',
        values,
        savedValues,
        savedAt,
        fields: CAPABILITY_TOGGLES.filter(
          ({ isComingSoon }) => !isComingSoon,
        ).map(({ capability, field }) => ({
          id: field,
          label: t(`toggleLabel.${capability}`),
          display: (draftValues: TSettingsFeaturesValues) =>
            draftValues[field] ? t('switchOn') : t('switchOff'),
        })),
        onRestore: setValues,
      }}
    >
      <Card>
        <Card.Header title={t('capabilitiesHeading')} headingLevel={2} />
        <Card.Body>
          {CAPABILITY_TOGGLES.map(({ capability, field, isComingSoon }) => {
            const isLocked = !entitledCapabilities.includes(capability);
            const label = t(`toggleLabel.${capability}`);
            const description = t(`toggleDescription.${capability}`);

            if (isComingSoon) {
              return (
                <SettingRow
                  key={capability}
                  label={label}
                  description={description}
                >
                  <StatusBadge hasDot={false}>
                    {t('comingSoonBadge')}
                  </StatusBadge>
                </SettingRow>
              );
            }

            return (
              <SettingRow
                key={capability}
                label={label}
                description={description}
                isLocked={isLocked}
                lockedReason={isLocked ? t('planLockedBadge') : undefined}
              >
                <Switch
                  isChecked={values[field]}
                  onCheckedChange={(checked) => handleToggle(field, checked)}
                  isDisabled={isLocked || isPending || isArchived}
                  ariaLabel={label}
                  labels={{ on: t('switchOn'), off: t('switchOff') }}
                  aria-describedby={isArchived ? archivedNoticeId : undefined}
                />
              </SettingRow>
            );
          })}
        </Card.Body>
      </Card>
    </SettingsFormShell>
  );
};
