'use client';

import { LookPreview } from '@admin/components/look-preview';
import { updateLookAction } from '@admin/server/site-config/update-look-action';
import type { TLookFormValues } from '@admin/utils/default-look-values/default-look-values';
import {
  ALERT_TYPE,
  ICONS,
  PRESET_REGISTRY,
  Size,
  type TPresetId,
} from '@blog/config';
import { Alert } from '@blog/ui/atoms/alert';
import { Button } from '@blog/ui/atoms/button';
import { Heading } from '@blog/ui/atoms/heading';
import { Icon } from '@blog/ui/atoms/icon';
import { Text } from '@blog/ui/atoms/text';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { LookFormAdvancedSection } from './look-form-advanced-section';
import { LookFormBasicSection } from './look-form-basic-section';
import { LookFormImagesSection } from './look-form-images-section';
import { lookFormVariants } from './look-form-variants';

export type TLookFormProps = {
  tenantSlug: string;
  initialValues: TLookFormValues;
};

export type TLookFormFieldSetter = <K extends keyof TLookFormValues>(
  key: K,
  value: TLookFormValues[K],
) => void;

/**
 * Applying a preset (via the picker or "Reset to preset") re-seeds every
 * `PRESET_REGISTRY` default — that's what "preset" means: a starting point,
 * not a locked-in choice. Individual controls remain freely adjustable
 * afterward. Brand images are independent of preset, so `current`'s asset
 * URLs carry through unchanged rather than being reset.
 */
const applyPresetDefaults = (
  preset: TPresetId,
  current: TLookFormValues,
): TLookFormValues => {
  const tokens = PRESET_REGISTRY[preset].themeTokens;

  return {
    preset,
    accentHue: tokens.accentHue,
    logoHue: undefined,
    headingFont: tokens.headingFont,
    bodyFont: tokens.bodyFont,
    radiusScale: tokens.radiusScale,
    density: tokens.density,
    chromeOn: tokens.chromeOn,
    logoAssetUrl: current.logoAssetUrl,
    faviconAssetUrl: current.faviconAssetUrl,
  };
};

const valuesEqual = (a: TLookFormValues, b: TLookFormValues): boolean => {
  return (
    a.preset === b.preset &&
    a.accentHue === b.accentHue &&
    a.logoHue === b.logoHue &&
    a.headingFont === b.headingFont &&
    a.bodyFont === b.bodyFont &&
    a.radiusScale === b.radiusScale &&
    a.density === b.density &&
    a.chromeOn === b.chromeOn &&
    a.logoAssetUrl === b.logoAssetUrl &&
    a.faviconAssetUrl === b.faviconAssetUrl
  );
};

export const LookForm = ({ tenantSlug, initialValues }: TLookFormProps) => {
  const [values, setValues] = useState<TLookFormValues>(initialValues);
  // The last known-persisted state: `handleSave`'s own fields on a
  // successful save, plus the two brand-asset URLs the instant their own
  // (independently persisted) upload/remove action succeeds — everything
  // `isDirty` compares `values` against.
  const [savedValues, setSavedValues] =
    useState<TLookFormValues>(initialValues);
  const [isPending, startTransition] = useTransition();
  const [saveResult, setSaveResult] = useState<'idle' | 'success' | 'error'>(
    'idle',
  );

  const isDirty = !valuesEqual(values, savedValues);

  const updateField: TLookFormFieldSetter = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === 'logoAssetUrl' || key === 'faviconAssetUrl') {
      setSavedValues((prev) => ({ ...prev, [key]: value }));
    }
    setSaveResult('idle');
  };

  const handlePresetChange = (preset: TPresetId) => {
    setValues((prev) => applyPresetDefaults(preset, prev));
    setSaveResult('idle');
  };

  const handleReset = () => {
    setValues((prev) => applyPresetDefaults(prev.preset, prev));
    setSaveResult('idle');
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateLookAction(tenantSlug, {
        preset: values.preset,
        accentHue: values.accentHue,
        logoHue: values.logoHue ?? null,
        headingFont: values.headingFont,
        bodyFont: values.bodyFont,
        radiusScale: values.radiusScale,
        density: values.density,
      });
      setSaveResult(result.ok ? 'success' : 'error');
      if (result.ok) setSavedValues(values);
    });
  };

  const t = useTranslations('lookForm');

  const {
    root,
    pageHead,
    pageHeadText,
    actions,
    grid,
    stack,
    card,
    cardHead,
    cardHeadDesc,
    cardBody,
    disclosure,
    summary,
    summaryIcon,
    disclosureBody,
    note,
  } = lookFormVariants();

  return (
    <div className={root()}>
      <div className={pageHead()}>
        <div className={pageHeadText()}>
          <Heading level={1} size={Size.MD}>
            {t('heading')}
          </Heading>
          <Text variant="muted">{t('subtitle')}</Text>
        </div>
        <div className={actions()}>
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            isDisabled={!isDirty}
          >
            {t('resetButton')}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            isDisabled={isPending || !isDirty}
          >
            {isPending ? t('savingButton') : t('saveButton')}
          </Button>
        </div>
      </div>

      {saveResult === 'success' && (
        <Alert type={ALERT_TYPE.SUCCESS} message={t('alertSuccess')} />
      )}
      {saveResult === 'error' && (
        <Alert type={ALERT_TYPE.ERROR} message={t('alertError')} />
      )}

      <div className={grid()}>
        <div className={stack()}>
          <section className={card()}>
            <header className={cardHead()}>
              <Heading level={2} size={Size.XS}>
                {t('basicHeading')}
              </Heading>
              <span className={cardHeadDesc()}>{t('basicDescription')}</span>
            </header>
            <div className={cardBody()}>
              <LookFormBasicSection
                preset={values.preset}
                onPresetChange={handlePresetChange}
                accentHue={values.accentHue}
                logoHue={values.logoHue}
                onFieldChange={updateField}
              />
              <LookFormImagesSection
                tenantSlug={tenantSlug}
                logoAssetUrl={values.logoAssetUrl}
                faviconAssetUrl={values.faviconAssetUrl}
                onFieldChange={updateField}
              />
            </div>
          </section>

          <details className={disclosure()}>
            <summary className={summary()}>
              <Icon
                name={ICONS.CHEVRON_RIGHT}
                className={summaryIcon()}
                aria-hidden="true"
              />
              {t('advancedSummary')}
            </summary>
            <div className={disclosureBody()}>
              <LookFormAdvancedSection
                isChromeOn={values.chromeOn}
                headingFont={values.headingFont}
                bodyFont={values.bodyFont}
                radiusScale={values.radiusScale}
                density={values.density}
                onFieldChange={updateField}
              />
            </div>
          </details>

          <p className={note()}>{t('footerNote')}</p>
        </div>

        <div className={stack()}>
          <LookPreview
            tenantSlug={tenantSlug}
            accentHue={values.accentHue}
            logoHue={values.logoHue}
            headingFont={values.headingFont}
            bodyFont={values.bodyFont}
            isChromeOn={values.chromeOn}
          />
        </div>
      </div>
    </div>
  );
};
