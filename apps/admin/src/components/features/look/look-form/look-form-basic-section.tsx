'use client';

import { LogoHueField } from '@admin/components/features/look/logo-hue-field';
import { HueSlider } from '@admin/components/shared/hue-slider';
import { PresetPicker } from '@admin/components/shared/preset-picker';
import {
  accentHueGradient,
  buildAccentPreviewTokens,
} from '@admin/utils/theme-preview-tokens/theme-preview-tokens';
import type { TPresetId } from '@blog/config';
import { SettingRow } from '@blog/ui/molecules/setting-row';
import { useTranslations } from 'next-intl';

import type { TLookFormFieldSetter } from './look-form';
import { lookFormVariants } from './look-form-variants';

export type TLookFormBasicSectionProps = {
  preset: TPresetId;
  onPresetChange: (preset: TPresetId) => void;
  accentHue: number;
  logoHue: number | undefined;
  onFieldChange: TLookFormFieldSetter;
};

/** The preset picker, accent hue, and logo hue controls — the settings a preset choice seeds directly. */
export const LookFormBasicSection = ({
  preset,
  onPresetChange,
  accentHue,
  logoHue,
  onFieldChange,
}: TLookFormBasicSectionProps) => {
  const t = useTranslations('lookForm');
  const { hueField, swatch, hueValue } = lookFormVariants();

  const accentHueLabel = t('accentHueLabel');
  const swatchColor = buildAccentPreviewTokens(accentHue, false)[
    '--brand-primary'
  ];

  return (
    <>
      <SettingRow label={t('presetLabel')} description={t('presetDescription')}>
        <PresetPicker value={preset} onChange={onPresetChange} />
      </SettingRow>

      <SettingRow
        label={accentHueLabel}
        description={t('accentHueDescription')}
        canControlGrow={true}
      >
        <div className={hueField()}>
          <span
            className={swatch()}
            aria-hidden="true"
            style={{ background: swatchColor }}
          />
          <HueSlider
            ariaLabel={accentHueLabel}
            value={accentHue}
            onChange={(value) => onFieldChange('accentHue', value)}
            trackStyle={{ background: accentHueGradient() }}
          />
          <span className={hueValue()}>{accentHue}°</span>
        </div>
      </SettingRow>

      <SettingRow
        label={t('logoHueLabel')}
        description={t('logoHueDescription')}
        canControlGrow={true}
      >
        <LogoHueField
          accentHue={accentHue}
          logoHue={logoHue}
          onChange={(hue) => onFieldChange('logoHue', hue)}
          isDark={false}
        />
      </SettingRow>
    </>
  );
};
