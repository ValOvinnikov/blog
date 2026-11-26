import {
  deriveButtonColors,
  PRESET_REGISTRY,
  type TMaybeUndefined,
  type TPresetId,
} from '@shinefold/config';
import { isHexColor } from '@shinefold/utils/color';
import { isUndefined } from '@shinefold/utils/primitives';

export type TButtonColorValues = {
  buttonColor?: string;
  buttonColorDark?: string;
};

export type TButtonColorField = keyof TButtonColorValues;

const hexOrUndefined = (value: TMaybeUndefined<string>) =>
  value && isHexColor(value) ? value : undefined;

export const toButtonColors = ({
  buttonColor,
  buttonColorDark,
}: TButtonColorValues) => {
  const color = hexOrUndefined(buttonColor);

  return color
    ? deriveButtonColors({
        color,
        darkGroundColor: hexOrUndefined(buttonColorDark),
      })
    : undefined;
};

export const isButtonColorInvalid = (value: TMaybeUndefined<string>) =>
  !isUndefined(value) && !isHexColor(value);

export const toPresetButtonColor = (
  preset: TPresetId,
): TMaybeUndefined<string> => PRESET_REGISTRY[preset].buttonColor ?? undefined;

export const withPresetButtonColor = <
  T extends TButtonColorValues & { preset: TPresetId },
>(
  values: T,
): T & TButtonColorValues => ({
  ...values,
  buttonColor: values.buttonColor ?? toPresetButtonColor(values.preset),
});

export const buttonColorFollowKey = (preset: TPresetId) =>
  isUndefined(toPresetButtonColor(preset))
    ? 'buttonColorFollowAccent'
    : 'buttonColorFollowPreset';
