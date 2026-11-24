'use client';

import { AccentSwatch } from '@platform/components/shared/accent-swatch';
import { HueSlider } from '@platform/components/shared/hue-slider';
import { PresetPicker } from '@platform/components/shared/preset-picker';
import { PRESET_PICKER_LAYOUT } from '@platform/constants/preset-picker';
import { isAccentHueAccessible, type TPresetId } from '@shinefold/config';
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
  const tLook = useTranslations('lookForm');
  const presetLegendId = useId();
  const presetHintId = useId();
  const accentLabelId = useId();
  const accentErrorId = useId();
  const isAccentHueRejected = !isAccentHueAccessible(accentHue);
  const {
    preset: presetGroup,
    legend,
    hint,
    accent,
    label,
    row,
    error,
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
            aria-describedby={isAccentHueRejected ? accentErrorId : undefined}
          />
          <AccentSwatch hue={accentHue} />
        </div>
        {isAccentHueRejected && (
          <p id={accentErrorId} className={error()}>
            {tLook('accentHueInaccessible')}
          </p>
        )}
      </div>
    </>
  );
};
