import {
  PRESET_ID,
  SPINNER_STYLE,
  type TPresetId,
  type TSpinnerStyle,
  type TSpinnerVariant,
} from '@blog/config/constants';

const PRESET_SPINNER_VARIANT: Record<TPresetId, TSpinnerVariant> = {
  [PRESET_ID.CONSOLE]: SPINNER_STYLE.BRAILLE,
  [PRESET_ID.EDITORIAL]: SPINNER_STYLE.RING,
};

export const toSpinnerVariant = (
  spinnerStyle: TSpinnerStyle,
  presetId: TPresetId,
): TSpinnerVariant =>
  spinnerStyle === SPINNER_STYLE.PRESET
    ? PRESET_SPINNER_VARIANT[presetId]
    : spinnerStyle;
