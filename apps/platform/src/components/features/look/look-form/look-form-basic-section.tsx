'use client';

import type { TPresetId } from '@blog/config';
import { LogoHueField } from '@platform/components/features/look/logo-hue-field';
import { Button } from '@platform/components/shared/button';
import { HueSlider } from '@platform/components/shared/hue-slider';
import { PresetPicker } from '@platform/components/shared/preset-picker';
import {
  accentHueGradient,
  buildAccentPreviewTokens,
} from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import type { TLookFormFieldSetter } from './look-form';
import { lookFormVariants } from './look-form-variants';

export type TLookFormBasicSectionProps = {
  preset: TPresetId;
  onPresetChange: (preset: TPresetId) => void;
  onReset: () => void;
  isResetDisabled: boolean;
  accentHue: number;
  accentHueFieldId: string;
  isAccentHueRejected: boolean;
  logoHue: number | undefined;
  onFieldChange: TLookFormFieldSetter;
  isArchived: boolean;
  archivedNoticeId: string;
};

export const LookFormBasicSection = ({
  preset,
  onPresetChange,
  onReset,
  isResetDisabled,
  accentHue,
  accentHueFieldId,
  isAccentHueRejected,
  logoHue,
  onFieldChange,
  isArchived,
  archivedNoticeId,
}: TLookFormBasicSectionProps) => {
  const archivedDescribedBy = isArchived ? archivedNoticeId : undefined;
  const accentHueErrorId = useId();
  const accentHueDescribedBy = isAccentHueRejected
    ? accentHueErrorId
    : archivedDescribedBy;
  const t = useTranslations('lookForm');
  const {
    field,
    fieldHeader,
    fieldLabel,
    fieldHint,
    tagSecondary,
    hueField,
    swatch,
    hueValue,
    fieldError,
  } = lookFormVariants();

  const accentHueLabel = t('accentHueLabel');
  const swatchColor = buildAccentPreviewTokens(accentHue, false)[
    '--brand-primary'
  ];

  return (
    <>
      <div className={field()}>
        <div className={fieldHeader()}>
          <span className={fieldLabel({ class: 'mb-0' })}>
            {t('presetLabel')}
          </span>
          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            isDisabled={isResetDisabled || isArchived}
            aria-describedby={archivedDescribedBy}
          >
            {t('resetButton')}
          </Button>
        </div>
        <p className={fieldHint()}>{t('presetDescription')}</p>
        <PresetPicker
          value={preset}
          onChange={onPresetChange}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </div>

      <div id={accentHueFieldId} className={field()}>
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
            isDisabled={isArchived}
            aria-describedby={accentHueDescribedBy}
            trackStyle={{ background: accentHueGradient() }}
          />
          <span className={hueValue()}>{accentHue}°</span>
        </div>
        {isAccentHueRejected && (
          <p id={accentHueErrorId} className={fieldError()} role="alert">
            {t('accentHueInaccessible')}
          </p>
        )}
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
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </div>
    </>
  );
};
