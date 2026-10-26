'use client';

import type { TPresetId } from '@blog/config';
import { FormField } from '@platform/components/shared/form-field';
import { HueSlider } from '@platform/components/shared/hue-slider';
import { PresetPicker } from '@platform/components/shared/preset-picker';
import { useTranslations } from 'next-intl';

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

  return (
    <>
      <FormField
        label={t('presetLabel')}
        hint={t('presetHint')}
        control={{ hasOwnAccessibleName: true }}
      >
        <PresetPicker value={preset} onChange={onPresetChange} />
      </FormField>
      <FormField
        label={t('accentLabel')}
        control={{ hasOwnAccessibleName: true }}
      >
        <HueSlider
          ariaLabel={t('accentLabel')}
          value={accentHue}
          onChange={onAccentHueChange}
        />
      </FormField>
    </>
  );
};
