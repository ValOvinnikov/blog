'use client';

import { ALERT_TYPE, FORM_STATUS, type TCapability } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Card } from '@platform/components/shared/card';
import { SettingRow } from '@platform/components/shared/setting-row';
import {
  SettingsFormShell,
  useSettingsForm,
} from '@platform/components/shared/settings-form-shell';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Switch } from '@platform/components/shared/switch';
import { useToast } from '@platform/context/toast-provider';
import {
  updateFeaturesAction,
  type TUpdateFeaturesResult,
} from '@platform/server/settings-features/update-features-action';
import {
  CAPABILITY_TOGGLES,
  hasReaderAccountFeature,
  type TSettingsFeaturesValues,
} from '@platform/utils/settings-features-fields/settings-features-fields';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const countChanges = (
  a: TSettingsFeaturesValues,
  b: TSettingsFeaturesValues,
): number =>
  CAPABILITY_TOGGLES.filter(({ field }) => a[field] !== b[field]).length;

export type TFeaturesSettingsProps = {
  tenantId: string;
  entitledCapabilities: TCapability[];
  initialValues: TSettingsFeaturesValues;
  savedAt?: Date;
  archivedAt?: Date;
};

// A capability outside the plan is shown locked rather than hidden; the Server
// Action re-checks entitlement, so the disabled switch is only a courtesy.
export const FeaturesSettings = ({
  tenantId,
  entitledCapabilities,
  initialValues,
  savedAt,
  archivedAt,
}: TFeaturesSettingsProps) => {
  const t = useTranslations('featuresSettings');
  const toast = useToast();
  const router = useRouter();
  const {
    values,
    setValues,
    status,
    isPending,
    isArchived,
    archivedNoticeId,
    form,
  } = useSettingsForm<TSettingsFeaturesValues, TUpdateFeaturesResult>({
    initialValues,
    archivedAt,
    onSubmit: (vals) => updateFeaturesAction(tenantId, vals),
    onSuccess: () => {
      toast.success({
        message: t('alertSuccess'),
      });
      router.refresh();
    },
    countChanges,
    draft: {
      tenantId,
      page: 'features',
      savedAt,
      fields: CAPABILITY_TOGGLES.filter(
        ({ isComingSoon }) => !isComingSoon,
      ).map(({ capability, field }) => ({
        id: field,
        label: t(`toggleLabel.${capability}`),
        display: (draftValues: TSettingsFeaturesValues) =>
          draftValues[field] ? t('switchOn') : t('switchOff'),
      })),
    },
  });

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
      form={form}
      errorTitle={status === FORM_STATUS.ERROR ? t('alertError') : undefined}
    >
      {!hasReaderAccountFeature(values) && (
        <Alert type={ALERT_TYPE.INFO} description={t('readerAccountNote')} />
      )}
      <Card>
        <Card.Header title={t('capabilitiesHeading')} />
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
                  aria={{
                    label: label,
                    describedBy: isArchived ? archivedNoticeId : undefined,
                  }}
                  isChecked={values[field]}
                  onCheckedChange={(checked) => handleToggle(field, checked)}
                  isDisabled={isLocked || isPending || isArchived}
                  labels={{ on: t('switchOn'), off: t('switchOff') }}
                />
              </SettingRow>
            );
          })}
        </Card.Body>
      </Card>
    </SettingsFormShell>
  );
};
