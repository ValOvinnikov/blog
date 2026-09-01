'use client';

import { Switch } from '@base-ui/react/switch';
import { ALERT_TYPE, type TCapability } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { PageHeader } from '@platform/components/shared/page-header';
import { SettingRow } from '@platform/components/shared/setting-row';
import { useToast } from '@platform/context/toast-provider';
import {
  CAPABILITY_TOGGLES,
  type TSettingsFeaturesValues,
} from '@platform/utils/settings-features-fields/settings-features-fields';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

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
  tenantSlug,
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
  const { values, setValues, status, isPending, handleSubmit } =
    useFormSubmission<TSettingsFeaturesValues, { ok: boolean }>({
      initialValues,
      onSubmit: (vals) => saveAction(tenantSlug, vals),
      onSuccess: () => {
        toast.success({
          command: 'features',
          state: 'saved',
          message: t('alertSuccess'),
        });
        router.refresh();
      },
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
            isDisabled={isPending || isArchived}
            aria-describedby={isArchived ? archivedNoticeId : undefined}
          >
            {isPending ? t('savingButton') : t('saveButton')}
          </Button>
        }
      />

      {archivedAt && (
        <ArchivedTenantNotice id={archivedNoticeId} archivedAt={archivedAt} />
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
