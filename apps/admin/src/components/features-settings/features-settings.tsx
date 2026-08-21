'use client';

import {
  CAPABILITY_TOGGLES,
  type TSettingsFeaturesValues,
} from '@admin/utils/settings-features-fields/settings-features-fields';
import { Switch } from '@base-ui/react/switch';
import { ALERT_TYPE, Size, type TCapability } from '@blog/config';
import { Alert } from '@blog/ui/atoms/alert';
import { Button } from '@blog/ui/atoms/button';
import { Heading } from '@blog/ui/atoms/heading';
import { StatusBadge } from '@blog/ui/atoms/status-badge';
import { SettingRow } from '@blog/ui/molecules/setting-row';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

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
 * outside `entitledCapabilities` renders disabled with a "Growth plan"
 * badge rather than hidden, so the tenant knows it exists — the client-side
 * `disabled` is a courtesy, the Server Action re-checks entitlement itself.
 */
export const FeaturesSettings = ({
  tenantSlug,
  entitledCapabilities,
  initialValues,
  saveAction,
}: TFeaturesSettingsProps) => {
  const t = useTranslations('featuresSettings');
  const router = useRouter();
  const [values, setValues] = useState<TSettingsFeaturesValues>(initialValues);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isPending, startTransition] = useTransition();

  const {
    root,
    pagehead,
    description,
    alert,
    card,
    toggleRow,
    switchTrack,
    switchThumb,
    switchLabel,
  } = featuresSettingsVariants();

  const handleToggle = (
    field: keyof TSettingsFeaturesValues,
    checked: boolean,
  ) => {
    setValues((prev) => ({ ...prev, [field]: checked }));
    setStatus('idle');
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveAction(tenantSlug, values);
      setStatus(result.ok ? 'success' : 'error');
      if (result.ok) router.refresh();
    });
  };

  return (
    <div className={root()}>
      <div className={pagehead()}>
        <div>
          <Heading level={1} size={Size.MD}>
            {t('heading')}
          </Heading>
          <p className={description()}>{t('description')}</p>
        </div>
        <Button
          variant="primary"
          onClick={handleSave}
          isDisabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? t('savingButton') : t('saveButton')}
        </Button>
      </div>

      {status === 'success' && (
        <Alert
          type={ALERT_TYPE.SUCCESS}
          message={t('alertSuccess')}
          className={alert()}
        />
      )}
      {status === 'error' && (
        <Alert
          type={ALERT_TYPE.ERROR}
          message={t('alertError')}
          className={alert()}
        />
      )}

      <div className={card()}>
        {CAPABILITY_TOGGLES.map(({ capability, field }) => {
          const isLocked = !entitledCapabilities.includes(capability);
          const label = t(`toggleLabel.${capability}`);

          return (
            <SettingRow
              key={capability}
              label={label}
              description={t(`toggleDescription.${capability}`)}
            >
              <div className={toggleRow()}>
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
                {isLocked && (
                  <StatusBadge tone="warn">{t('planLockedBadge')}</StatusBadge>
                )}
              </div>
            </SettingRow>
          );
        })}
      </div>
    </div>
  );
};
