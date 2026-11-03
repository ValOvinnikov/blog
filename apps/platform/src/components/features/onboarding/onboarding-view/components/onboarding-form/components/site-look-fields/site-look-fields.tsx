'use client';

import type { TPresetId } from '@blog/config';
import { AccentSwatch } from '@platform/components/shared/accent-swatch';
import { HueSlider } from '@platform/components/shared/hue-slider';
import { PresetPicker } from '@platform/components/shared/preset-picker';
import { HUE_SLIDER_TRACK } from '@platform/constants/hue-slider';
import { PRESET_PICKER_LAYOUT } from '@platform/constants/preset-picker';
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
  const presetLegendId = useId();
  const presetHintId = useId();
  const accentLabelId = useId();
  const {
    preset: presetGroup,
    legend,
    hint,
    accent,
    label,
    row,
  } = siteLookFieldsVariants();

  return (
    <>
      <fieldset className={presetGroup()}>
        <legend id={presetLegendId} className={label({ class: legend() })}>
          {t('presetLabel')}
        </legend>
        <PresetPicker
          value={preset}
          onChange={onPresetChange}
          aria={{ labelledBy: presetLegendId, describedBy: presetHintId }}
          layout={PRESET_PICKER_LAYOUT.PAIRED}
        />
        <p id={presetHintId} className={hint()}>
          {t('presetHint')}
        </p>
      </fieldset>
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
