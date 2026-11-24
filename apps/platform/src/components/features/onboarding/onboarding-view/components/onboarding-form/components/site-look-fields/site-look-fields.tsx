'use client';

import { useFieldErrorText } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-field-error-text';
import { AccentSwatch } from '@platform/components/shared/accent-swatch';
import { FormField } from '@platform/components/shared/form-field';
import { HueSlider } from '@platform/components/shared/hue-slider';
import { PresetPicker } from '@platform/components/shared/preset-picker';
import { FIELD_APPEARANCE } from '@platform/constants/field-appearance';
import { ONBOARDING_FIELD_ERROR } from '@platform/constants/onboarding';
import { PRESET_PICKER_LAYOUT } from '@platform/constants/preset-picker';
import type { TCreateSiteFieldError } from '@platform/server/onboarding/create-site-input';
import {
  isAccentHueAccessible,
  type TMaybeUndefined,
  type TPresetId,
} from '@shinefold/config';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { siteLookFieldsVariants } from './site-look-fields-variants';

export type TSiteLookFieldsProps = {
  preset: TPresetId;
  accentHue: number;
  accentHueError: TMaybeUndefined<TCreateSiteFieldError>;
  onPresetChange: (preset: TPresetId) => void;
  onAccentHueChange: (accentHue: number) => void;
};

export const SiteLookFields = ({
  preset,
  accentHue,
  accentHueError,
  onPresetChange,
  onAccentHueChange,
}: TSiteLookFieldsProps) => {
  const t = useTranslations('onboardingForm');
  const errorText = useFieldErrorText();
  const presetLegendId = useId();
  const presetHintId = useId();
  const {
    preset: presetGroup,
    legend,
    hint,
    label,
    row,
  } = siteLookFieldsVariants();
  const accentLabel = t('accentLabel');
  const accentError =
    accentHueError ??
    (isAccentHueAccessible(accentHue)
      ? undefined
      : ONBOARDING_FIELD_ERROR.ACCENT_HUE_INACCESSIBLE);

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
      <FormField
        label={accentLabel}
        error={accentError && errorText(accentError)}
        control={{ appearance: FIELD_APPEARANCE.WIZARD }}
      >
        <div className={row()}>
          <HueSlider
            name={{ ariaLabel: accentLabel }}
            value={accentHue}
            onChange={onAccentHueChange}
          />
          <AccentSwatch hue={accentHue} />
        </div>
      </FormField>
    </>
  );
};
