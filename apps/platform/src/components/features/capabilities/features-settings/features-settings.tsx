'use client';

import { Switch } from '@base-ui/react/switch';
import type { TCapability } from '@blog/config';
import { Card } from '@platform/components/shared/card';
import { SettingRow } from '@platform/components/shared/setting-row';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { useToast } from '@platform/context/toast-provider';
import {
  CAPABILITY_TOGGLES,
  type TSettingsFeaturesValues,
} from '@platform/utils/settings-features-fields/settings-features-fields';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { featuresSettingsVariants } from './features-settings-variants';

const valuesEqual = (
  a: TSettingsFeaturesValues,
  b: TSettingsFeaturesValues,
): boolean => CAPABILITY_TOGGLES.every(({ field }) => a[field] === b[field]);

export type TFeaturesSettingsProps = {
  tenantId: string;
  /** Which capabilities the tenant's plan entitles — everything else renders locked, visible but disabled. */
  entitledCapabilities: TCapability[];
  initialValues: TSettingsFeaturesValues;
  saveAction: (
    tenantId: string,
    values: TSettingsFeaturesValues,
  ) => Promise<{ ok: boolean }>;
  /** When set, the tenant is archived: Save is disabled and a notice explains why. */
  archivedAt?: Date;
};

/**
 * The Features tab: one toggle per `settings_features` column. A capability
 * outside `entitledCapabilities` renders through `SettingRow`'s locked
 * treatment rather than hidden, so the tenant knows it exists — the
 * client-side `disabled` is a courtesy, the Server Action re-checks
 * entitlement itself.
 */
export const FeaturesSettings = ({
  tenantId,
  entitledCapabilities,
  initialValues,
  saveAction,
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
        // router.refresh() re-renders the server component but doesn't reset this hook's state, so the saved baseline is updated explicitly here.
        setSavedValues(submittedValues);
        toast.success({
          message: t('alertSuccess'),
        });
        router.refresh();
      },
    });

  const isDirty = !valuesEqual(values, savedValues);

  const { switchTrack, switchThumb, switchLabel } = featuresSettingsVariants();

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
      isSaveDisabled={!isDirty || isArchived}
      isPending={isPending}
      archivedAt={archivedAt}
      archivedNoticeId={archivedNoticeId}
      hasError={status === 'error'}
      errorTitle={t('alertError')}
    >
      <Card>
        <Card.Header title={t('capabilitiesHeading')} headingLevel={2} />
        <Card.Body>
          {CAPABILITY_TOGGLES.map(({ capability, field }) => {
            const isLocked = !entitledCapabilities.includes(capability);
            const label = t(`toggleLabel.${capability}`);

            return (
              <SettingRow
                key={capability}
                label={label}
                description={t(`toggleDescription.${capability}`)}
                isLocked={isLocked}
                lockedReason={isLocked ? t('planLockedBadge') : undefined}
              >
                <Switch.Root
                  checked={values[field]}
                  onCheckedChange={(checked) => handleToggle(field, checked)}
                  disabled={isLocked || isPending || isArchived}
                  aria-label={label}
                  aria-describedby={isArchived ? archivedNoticeId : undefined}
                  className={switchTrack()}
                >
                  <Switch.Thumb className={switchThumb()} />
                </Switch.Root>
                <span className={switchLabel()}>
                  {values[field] ? t('switchOn') : t('switchOff')}
                </span>
              </SettingRow>
            );
          })}
        </Card.Body>
      </Card>
    </SettingsFormShell>
  );
};
