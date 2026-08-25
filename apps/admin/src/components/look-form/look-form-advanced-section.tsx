'use client';

import { FontPicker } from '@admin/components/font-picker';
import { Switch } from '@base-ui/react/switch';
import {
  DENSITY,
  RADIUS_SCALE,
  type TDensity,
  type TFontChoice,
  type TRadiusScale,
} from '@blog/config';
import { SegmentedControl } from '@blog/ui/atoms/segmented-control';
import { SettingRow } from '@blog/ui/molecules/setting-row';
import { useTranslations } from 'next-intl';

import type { TLookFormFieldSetter } from './look-form';
import { lookFormVariants } from './look-form-variants';

export type TLookFormAdvancedSectionProps = {
  isChromeOn: boolean;
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  radiusScale: TRadiusScale;
  density: TDensity;
  onFieldChange: TLookFormFieldSetter;
};

/** Fonts, radius, density, and terminal chrome — the controls collapsed under "Advanced" by default. */
export const LookFormAdvancedSection = ({
  isChromeOn,
  headingFont,
  bodyFont,
  radiusScale,
  density,
  onFieldChange,
}: TLookFormAdvancedSectionProps) => {
  const t = useTranslations('lookForm');
  const { switchRow, switchTrack, switchThumb } = lookFormVariants();

  const radiusOptions = Object.values(RADIUS_SCALE).map((scale) => ({
    value: scale,
    label: t(`radiusScaleOptionLabel.${scale}`),
  }));

  const densityOptions = Object.values(DENSITY).map((option) => ({
    value: option,
    label: t(`densityOptionLabel.${option}`),
  }));

  const terminalChromeLabel = t('terminalChromeLabel');
  const headingFontLabel = t('headingFontLabel');
  const bodyFontLabel = t('bodyFontLabel');
  const radiusScaleLabel = t('radiusScaleLabel');
  const densityLabel = t('densityLabel');

  return (
    <>
      <SettingRow
        label={terminalChromeLabel}
        description={t('terminalChromeDescription')}
      >
        <div className={switchRow()}>
          <Switch.Root
            checked={isChromeOn}
            onCheckedChange={(checked) => onFieldChange('chromeOn', checked)}
            aria-label={terminalChromeLabel}
            className={switchTrack()}
          >
            <Switch.Thumb className={switchThumb()} />
          </Switch.Root>
          <span>{isChromeOn ? t('switchOn') : t('switchOff')}</span>
        </div>
      </SettingRow>

      <SettingRow
        label={headingFontLabel}
        description={t('headingFontDescription')}
      >
        <FontPicker
          ariaLabel={headingFontLabel}
          value={headingFont}
          onChange={(font) => onFieldChange('headingFont', font)}
        />
      </SettingRow>

      <SettingRow label={bodyFontLabel}>
        <FontPicker
          ariaLabel={bodyFontLabel}
          value={bodyFont}
          onChange={(font) => onFieldChange('bodyFont', font)}
        />
      </SettingRow>

      <SettingRow
        label={radiusScaleLabel}
        description={t('radiusScaleDescription')}
      >
        <SegmentedControl<TRadiusScale>
          ariaLabel={radiusScaleLabel}
          options={radiusOptions}
          value={radiusScale}
          onChange={(scale) => onFieldChange('radiusScale', scale)}
        />
      </SettingRow>

      <SettingRow label={densityLabel} description={t('densityDescription')}>
        <SegmentedControl<TDensity>
          ariaLabel={densityLabel}
          options={densityOptions}
          value={density}
          onChange={(option) => onFieldChange('density', option)}
        />
      </SettingRow>
    </>
  );
};
