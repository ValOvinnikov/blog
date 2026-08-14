'use client';

import { BrandAssetField } from '@admin/components/brand-asset-field';
import { FontPicker } from '@admin/components/font-picker';
import { HueSlider } from '@admin/components/hue-slider';
import { LogoHueField } from '@admin/components/logo-hue-field';
import { LookPreview } from '@admin/components/look-preview';
import { PresetPicker } from '@admin/components/preset-picker';
import { updateLookAction } from '@admin/server/site-config/update-look-action';
import type { TLookFormValues } from '@admin/utils/default-look-values/default-look-values';
import {
  accentHueGradient,
  buildAccentPreviewTokens,
} from '@admin/utils/theme-preview-tokens/theme-preview-tokens';
import { Switch } from '@base-ui/react/switch';
import {
  ALERT_TYPE,
  DENSITY,
  ICONS,
  PRESET_REGISTRY,
  RADIUS_SCALE,
  Size,
  type TDensity,
  type TPresetId,
  type TRadiusScale,
} from '@blog/config';
import { Alert } from '@blog/ui/atoms/alert';
import { Button } from '@blog/ui/atoms/button';
import { Heading } from '@blog/ui/atoms/heading';
import { Icon } from '@blog/ui/atoms/icon';
import { SegmentedControl } from '@blog/ui/atoms/segmented-control';
import { Text } from '@blog/ui/atoms/text';
import { SettingRow } from '@blog/ui/molecules/setting-row';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { lookFormVariants } from './look-form-variants';

export type TLookFormProps = {
  tenantSlug: string;
  initialValues: TLookFormValues;
};

/**
 * Applying a preset (via the picker or "Reset to preset") re-seeds every
 * `PRESET_REGISTRY` default — that's what "preset" means: a starting point,
 * not a locked-in choice. Individual controls remain freely adjustable
 * afterward. Brand images are independent of preset, so `current`'s asset
 * URLs carry through unchanged rather than being reset.
 */
function applyPresetDefaults(
  preset: TPresetId,
  current: TLookFormValues,
): TLookFormValues {
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
}

function valuesEqual(a: TLookFormValues, b: TLookFormValues): boolean {
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
}

export function LookForm({ tenantSlug, initialValues }: TLookFormProps) {
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

  function updateField<K extends keyof TLookFormValues>(
    key: K,
    value: TLookFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === 'logoAssetUrl' || key === 'faviconAssetUrl') {
      setSavedValues((prev) => ({ ...prev, [key]: value }));
    }
    setSaveResult('idle');
  }

  function handlePresetChange(preset: TPresetId) {
    setValues((prev) => applyPresetDefaults(preset, prev));
    setSaveResult('idle');
  }

  function handleReset() {
    setValues((prev) => applyPresetDefaults(prev.preset, prev));
    setSaveResult('idle');
  }

  function handleSave() {
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
  }

  const t = useTranslations('lookForm');

  const radiusOptions = Object.values(RADIUS_SCALE).map((scale) => ({
    value: scale,
    label: t(`radiusScaleOptionLabel.${scale}`),
  }));

  const densityOptions = Object.values(DENSITY).map((density) => ({
    value: density,
    label: t(`densityOptionLabel.${density}`),
  }));

  const accentHueLabel = t('accentHueLabel');
  const headingFontLabel = t('headingFontLabel');
  const bodyFontLabel = t('bodyFontLabel');
  const radiusScaleLabel = t('radiusScaleLabel');
  const densityLabel = t('densityLabel');
  const terminalChromeLabel = t('terminalChromeLabel');

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
    hueField,
    swatch,
    hueValue,
    switchRow,
    switchTrack,
    switchThumb,
    note,
    uploads,
  } = lookFormVariants();

  const swatchColor = buildAccentPreviewTokens(values.accentHue, false)[
    '--brand-primary'
  ];

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
            disabled={!isDirty}
          >
            {t('resetButton')}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending || !isDirty}
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
              <SettingRow
                label={t('presetLabel')}
                description={t('presetDescription')}
              >
                <PresetPicker
                  value={values.preset}
                  onChange={handlePresetChange}
                />
              </SettingRow>

              <SettingRow
                label={accentHueLabel}
                description={t('accentHueDescription')}
                controlGrows={true}
              >
                <div className={hueField()}>
                  <span
                    className={swatch()}
                    aria-hidden="true"
                    style={{ background: swatchColor }}
                  />
                  <HueSlider
                    ariaLabel={accentHueLabel}
                    value={values.accentHue}
                    onChange={(value) => updateField('accentHue', value)}
                    trackStyle={{ background: accentHueGradient() }}
                  />
                  <span className={hueValue()}>{values.accentHue}°</span>
                </div>
              </SettingRow>

              <SettingRow
                label={t('logoHueLabel')}
                description={t('logoHueDescription')}
                controlGrows={true}
              >
                <LogoHueField
                  accentHue={values.accentHue}
                  logoHue={values.logoHue}
                  onChange={(logoHue) => updateField('logoHue', logoHue)}
                  isDark={false}
                />
              </SettingRow>

              <SettingRow
                label={t('brandImagesLabel')}
                description={t('brandImagesDescription')}
              >
                <div className={uploads()}>
                  <BrandAssetField
                    tenantSlug={tenantSlug}
                    kind="logo"
                    label={t('logoFieldLabel')}
                    hint={t('logoFieldHint')}
                    currentUrl={values.logoAssetUrl}
                    onChange={(url) => updateField('logoAssetUrl', url)}
                  />
                  <BrandAssetField
                    tenantSlug={tenantSlug}
                    kind="favicon"
                    label={t('faviconFieldLabel')}
                    hint={t('faviconFieldHint')}
                    currentUrl={values.faviconAssetUrl}
                    onChange={(url) => updateField('faviconAssetUrl', url)}
                  />
                </div>
              </SettingRow>
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
              <SettingRow
                label={terminalChromeLabel}
                description={t('terminalChromeDescription')}
              >
                <div className={switchRow()}>
                  <Switch.Root
                    checked={values.chromeOn}
                    onCheckedChange={(checked) =>
                      updateField('chromeOn', checked)
                    }
                    aria-label={terminalChromeLabel}
                    className={switchTrack()}
                  >
                    <Switch.Thumb className={switchThumb()} />
                  </Switch.Root>
                  <span>
                    {values.chromeOn ? t('switchOn') : t('switchOff')}
                  </span>
                </div>
              </SettingRow>

              <SettingRow
                label={headingFontLabel}
                description={t('headingFontDescription')}
              >
                <FontPicker
                  ariaLabel={headingFontLabel}
                  value={values.headingFont}
                  onChange={(font) => updateField('headingFont', font)}
                />
              </SettingRow>

              <SettingRow label={bodyFontLabel}>
                <FontPicker
                  ariaLabel={bodyFontLabel}
                  value={values.bodyFont}
                  onChange={(font) => updateField('bodyFont', font)}
                />
              </SettingRow>

              <SettingRow
                label={radiusScaleLabel}
                description={t('radiusScaleDescription')}
              >
                <SegmentedControl<TRadiusScale>
                  ariaLabel={radiusScaleLabel}
                  options={radiusOptions}
                  value={values.radiusScale}
                  onChange={(scale) => updateField('radiusScale', scale)}
                />
              </SettingRow>

              <SettingRow
                label={densityLabel}
                description={t('densityDescription')}
              >
                <SegmentedControl<TDensity>
                  ariaLabel={densityLabel}
                  options={densityOptions}
                  value={values.density}
                  onChange={(density) => updateField('density', density)}
                />
              </SettingRow>
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
            chromeOn={values.chromeOn}
          />
        </div>
      </div>
    </div>
  );
}
