'use client';

import { Alert } from '@admin/components/shared/alert';
import { Button } from '@admin/components/shared/button';
import { Card } from '@admin/components/shared/card';
import { PageHeader } from '@admin/components/shared/page-header';
import { SettingRow } from '@admin/components/shared/setting-row';
import {
  CAPABILITY_TOGGLES,
  type TSettingsFeaturesValues,
} from '@admin/utils/settings-features-fields/settings-features-fields';
import { useFormSubmission } from '@admin/utils/use-form-submission/use-form-submission';
import { Switch } from '@base-ui/react/switch';
import { ALERT_TYPE, type TCapability } from '@blog/config';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { featuresSettingsVariants } from './features-settings-variants';

export type TFeaturesSettingsProps = {
  tenantSlug: string;
  /** Which capabilities the tenant's plan entitles — everything else renders locked, visible but disabled. */
  entitledCapabilities: TCapability[];
  initialValues: TSettingsFeaturesValues;
  saveAction: (
    tenantSlug: string,
    values: TSettingsFeaturesValues,
  ) => Promise<{ ok: boolean }>;
};

/**
 * The Features tab: one toggle per `settings_features` column. A capability
 * outside `entitledCapabilities` renders through `SettingRow`'s locked
 * treatment rather than hidden, so the tenant knows it exists — the
 * client-side `disabled` is a courtesy, the Server Action re-checks
 * entitlement itself.
 */
export const FeaturesSettings = ({
  tenantSlug,
  entitledCapabilities,
  initialValues,
  saveAction,
}: TFeaturesSettingsProps) => {
  const t = useTranslations('featuresSettings');
  const router = useRouter();
  const { values, setValues, status, isPending, handleSubmit } =
    useFormSubmission<TSettingsFeaturesValues, { ok: boolean }>({
      initialValues,
      onSubmit: (vals) => saveAction(tenantSlug, vals),
      onSuccess: () => router.refresh(),
    });

  const { root, alert, switchTrack, switchThumb, switchLabel } =
    featuresSettingsVariants();

  const handleToggle = (
    field: keyof TSettingsFeaturesValues,
    checked: boolean,
  ) => {
    setValues((prev) => ({ ...prev, [field]: checked }));
  };

  return (
    <div className={root()}>
      <PageHeader
        title={t('heading')}
        description={t('description')}
        actions={
          <Button
            variant="primary"
            onClick={handleSubmit}
            isDisabled={isPending}
          >
            {isPending ? t('savingButton') : t('saveButton')}
          </Button>
        }
      />

      {status === 'success' && (
        <Alert
          type={ALERT_TYPE.SUCCESS}
          title={t('alertSuccess')}
          className={alert()}
        />
      )}
      {status === 'error' && (
        <Alert
          type={ALERT_TYPE.ERROR}
          title={t('alertError')}
          className={alert()}
        />
      )}

      <Card>
        <Card.Header title={t('capabilitiesHeading')} />
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
                  disabled={isLocked || isPending}
                  aria-label={label}
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
    </div>
  );
};
