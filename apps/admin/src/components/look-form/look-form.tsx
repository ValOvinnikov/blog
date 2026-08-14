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
  RADIUS_SCALE_LABEL,
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
import { useState, useTransition } from 'react';

import { lookFormVariants } from './look-form-variants';

const DENSITY_LABEL: Record<TDensity, string> = {
  [DENSITY.DEFAULT]: 'Default',
  [DENSITY.COMPACT]: 'Compact',
};

const RADIUS_OPTIONS = Object.values(RADIUS_SCALE).map((scale) => ({
  value: scale,
  label: RADIUS_SCALE_LABEL[scale],
}));

const DENSITY_OPTIONS = Object.values(DENSITY).map((density) => ({
  value: density,
  label: DENSITY_LABEL[density],
}));

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

export function LookForm({ tenantSlug, initialValues }: TLookFormProps) {
  const [values, setValues] = useState<TLookFormValues>(initialValues);
  const [isPending, startTransition] = useTransition();
  const [saveResult, setSaveResult] = useState<'idle' | 'success' | 'error'>(
    'idle',
  );

  function updateField<K extends keyof TLookFormValues>(
    key: K,
    value: TLookFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
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
    });
  }

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
    optionalTag,
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
          <Heading level={1}>Look</Heading>
          <Text variant="muted">
            Theme this site. Everything previews instantly below — nothing is
            live until you save.
          </Text>
        </div>
        <div className={actions()}>
          <Button type="button" variant="ghost" onClick={handleReset}>
            Reset to preset
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      {saveResult === 'success' && (
        <Alert type={ALERT_TYPE.SUCCESS} message="Saved to site_config." />
      )}
      {saveResult === 'error' && (
        <Alert
          type={ALERT_TYPE.ERROR}
          message="Couldn't save Look settings — try again."
        />
      )}

      <div className={grid()}>
        <div className={stack()}>
          <section className={card()}>
            <header className={cardHead()}>
              <Heading level={2}>Basic</Heading>
              <span className={cardHeadDesc()}>What most tenants touch</span>
            </header>
            <div className={cardBody()}>
              <SettingRow
                label="Preset"
                description="The starting point nearly every tenant picks. Sets fonts, radius, density, chrome, and voice defaults."
              >
                <PresetPicker
                  value={values.preset}
                  onChange={handlePresetChange}
                />
              </SettingRow>

              <SettingRow
                label="Accent hue"
                description="Only the hue changes — lightness & chroma are fixed (OKLCH), so contrast stays WCAG-verified."
              >
                <div className={hueField()}>
                  <span
                    className={swatch()}
                    aria-hidden="true"
                    style={{ background: swatchColor }}
                  />
                  <HueSlider
                    ariaLabel="Accent hue"
                    value={values.accentHue}
                    onChange={(value) => updateField('accentHue', value)}
                    trackStyle={{ background: accentHueGradient() }}
                  />
                  <span className={hueValue()}>{values.accentHue}°</span>
                </div>
              </SettingRow>

              <SettingRow
                label={
                  <>
                    Logo hue
                    <span className={optionalTag()}>optional</span>
                  </>
                }
                description="Tints the wordmark's tonal steps (--logo-1/2/3). Follows the accent hue unless you set it."
              >
                <LogoHueField
                  accentHue={values.accentHue}
                  logoHue={values.logoHue}
                  onChange={(logoHue) => updateField('logoHue', logoHue)}
                  isDark={false}
                />
              </SettingRow>

              <SettingRow
                label="Brand images"
                description="Stored in Vercel Blob — no on-the-fly transforms, so what you upload is what ships."
              >
                <div className={uploads()}>
                  <BrandAssetField
                    tenantSlug={tenantSlug}
                    kind="logo"
                    label="Logo"
                    hint="PNG, JPEG, or WebP · falls back to the polygon wordmark"
                    currentUrl={values.logoAssetUrl}
                    onChange={(url) => updateField('logoAssetUrl', url)}
                  />
                  <BrandAssetField
                    tenantSlug={tenantSlug}
                    kind="favicon"
                    label="Favicon"
                    hint="Pre-cropped square, please — Blob can't crop it for you. Non-square uploads are rejected."
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
              Advanced
              <span className={optionalTag()}>optional</span>
            </summary>
            <div className={disclosureBody()}>
              <SettingRow
                label="Terminal chrome"
                description="Window frame + terminal prompt around the site — the single most defining console-vs-editorial switch. Defaults from your preset. Not saved yet — site_config has no column for this field."
              >
                <div className={switchRow()}>
                  <Switch.Root
                    checked={values.chromeOn}
                    onCheckedChange={(checked) =>
                      updateField('chromeOn', checked)
                    }
                    aria-label="Terminal chrome"
                    className={switchTrack()}
                  >
                    <Switch.Thumb className={switchThumb()} />
                  </Switch.Root>
                  <span>{values.chromeOn ? 'On' : 'Off'}</span>
                </div>
              </SettingRow>

              <SettingRow
                label="Heading font"
                description="Closed set of five (static next/font loaders). Each renders in its own face."
              >
                <FontPicker
                  ariaLabel="Heading font"
                  value={values.headingFont}
                  onChange={(font) => updateField('headingFont', font)}
                />
              </SettingRow>

              <SettingRow label="Body font">
                <FontPicker
                  ariaLabel="Body font"
                  value={values.bodyFont}
                  onChange={(font) => updateField('bodyFont', font)}
                />
              </SettingRow>

              <SettingRow
                label="Radius scale"
                description="Corner roundness across every surface."
              >
                <SegmentedControl<TRadiusScale>
                  ariaLabel="Radius scale"
                  options={RADIUS_OPTIONS}
                  value={values.radiusScale}
                  onChange={(scale) => updateField('radiusScale', scale)}
                />
              </SettingRow>

              <SettingRow
                label="Density"
                description="Spacing and control size."
              >
                <SegmentedControl<TDensity>
                  ariaLabel="Density"
                  options={DENSITY_OPTIONS}
                  value={values.density}
                  onChange={(density) => updateField('density', density)}
                />
              </SettingRow>
            </div>
          </details>

          <p className={note()}>
            Radius scale and density are saved with the rest of this form but
            don&apos;t yet drive the inline preview above.
          </p>
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
