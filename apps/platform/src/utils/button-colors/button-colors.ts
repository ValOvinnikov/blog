import { deriveButtonColors, type TMaybeUndefined } from '@shinefold/config';
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
