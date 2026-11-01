'use client';

import type { TPresetId } from '@blog/config';
import { AccentSwatch } from '@platform/components/shared/accent-swatch';
import { FormField } from '@platform/components/shared/form-field';
import { HueSlider } from '@platform/components/shared/hue-slider';
import { PresetPicker } from '@platform/components/shared/preset-picker';
import { HUE_SLIDER_TRACK } from '@platform/constants/hue-slider';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { siteLookFieldsVariants } from './site-look-fields-variants';

export type TSiteLookFieldsProps = {
  preset: TPresetId;
  accentHue: number;
  onPresetChange: (preset: TPresetId) => void;
  onAccentHueChange: (accentHue: number) => void;
};

export const SiteLookFields = ({
  preset,
  accentHue,
  onPresetChange,
  onAccentHueChange,
}: TSiteLookFieldsProps) => {
  const t = useTranslations('onboardingForm');
  const accentLabelId = useId();
  const { accent, label, row } = siteLookFieldsVariants();

  return (
    <>
      <FormField
        label={t('presetLabel')}
        hint={t('presetHint')}
        control={{ hasOwnAccessibleName: true }}
      >
        <PresetPicker value={preset} onChange={onPresetChange} />
      </FormField>
      <div className={accent()}>
        <span id={accentLabelId} className={label()}>
          {t('accentLabel')}
        </span>
        <div className={row()}>
          <HueSlider
            name={{ labelledBy: accentLabelId }}
            value={accentHue}
            onChange={onAccentHueChange}
            track={HUE_SLIDER_TRACK.RAINBOW}
          />
          <AccentSwatch hue={accentHue} />
        </div>
      </div>
    </>
  );
};
