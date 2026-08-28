'use client';

import type { TPresetId } from '@blog/config';
import { LogoHueField } from '@platform/components/features/look/logo-hue-field';
import { HueSlider } from '@platform/components/shared/hue-slider';
import { PresetPicker } from '@platform/components/shared/preset-picker';
import {
  accentHueGradient,
  buildAccentPreviewTokens,
} from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
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
  const {
    field,
    fieldLabel,
    fieldHint,
    tagSecondary,
    hueField,
    swatch,
    hueValue,
  } = lookFormVariants();

  const accentHueLabel = t('accentHueLabel');
  const swatchColor = buildAccentPreviewTokens(accentHue, false)[
    '--brand-primary'
  ];

  return (
    <>
      <div className={field()}>
        <span className={fieldLabel()}>{t('presetLabel')}</span>
        <p className={fieldHint()}>{t('presetDescription')}</p>
        <PresetPicker value={preset} onChange={onPresetChange} />
      </div>

      <div className={field()}>
        <span className={fieldLabel()}>{accentHueLabel}</span>
        <p className={fieldHint()}>{t('accentHueDescription')}</p>
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
      </div>

      <div className={field()}>
        <span className={fieldLabel()}>
          {t('logoHueLabel')}
          <span className={tagSecondary()}>{t('optionalTag')}</span>
        </span>
        <p className={fieldHint()}>{t('logoHueDescription')}</p>
        <LogoHueField
          accentHue={accentHue}
          logoHue={logoHue}
          onChange={(hue) => onFieldChange('logoHue', hue)}
          isDark={false}
        />
      </div>
    </>
  );
};
