'use client';

import { ALERT_TYPE, FORM_STATUS, type TCapability } from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import { Alert } from '@platform/components/shared/alert';
import { Card } from '@platform/components/shared/card';
import {
  SettingsFormShell,
  useSettingsForm,
} from '@platform/components/shared/settings-form-shell';
import { useToast } from '@platform/context/toast-provider';
import {
  updateFeaturesAction,
  type TUpdateFeaturesResult,
} from '@platform/server/settings-features/update-features-action';
import {
  CAPABILITY_TOGGLES,
  SHOWN_CAPABILITY_TOGGLES,
  type TSettingsFeaturesValues,
} from '@platform/utils/settings-features-fields/settings-features-fields';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { CapabilityToggleRow } from './components/capability-toggle-row';

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
      {!values.readerAccountsEnabled && (
        <Alert type={ALERT_TYPE.INFO} description={t('readerAccountNote')} />
      )}
      <Card>
        <Card.Header title={t('capabilitiesHeading')} />
        <Card.Body>
          {SHOWN_CAPABILITY_TOGGLES.map((toggle) => {
            const { capability, field, parentField } = toggle;

            return (
              <CapabilityToggleRow
                key={capability}
                toggle={toggle}
                isEntitled={entitledCapabilities.includes(capability)}
                isChecked={values[field]}
                isParentOff={!isUndefined(parentField) && !values[parentField]}
                isFormLocked={isPending || isArchived}
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
