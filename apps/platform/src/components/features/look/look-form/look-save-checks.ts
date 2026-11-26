import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';
import { isBrandNameTooLong } from '@platform/utils/brand-name/brand-name';
import { isButtonColorInvalid } from '@platform/utils/button-colors/button-colors';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { isAccentHueAccessible } from '@shinefold/config';
import { hasArrayGotItems, objectKeys } from '@shinefold/utils/primitives';

export type TCheckedField =
  'accentHue' | 'buttonColor' | 'buttonColorDark' | 'brandName';

type TCheckedValues = Pick<TLookFormValues, TCheckedField>;

const CHECKED_ROWS = {
  accentHue: LOOK_ROW.COLOUR,
  buttonColor: LOOK_ROW.BUTTONS,
  buttonColorDark: LOOK_ROW.BUTTONS,
  brandName: LOOK_ROW.BRAND,
} as const satisfies Record<TCheckedField, TLookRow>;

const listInvalidFields = ({
  accentHue,
  buttonColor,
  buttonColorDark,
  brandName,
}: TCheckedValues): TCheckedField[] => {
  const isInvalid: Record<TCheckedField, boolean> = {
    accentHue: !isAccentHueAccessible(accentHue),
    buttonColor: isButtonColorInvalid(buttonColor),
    buttonColorDark: isButtonColorInvalid(buttonColorDark),
    brandName: isBrandNameTooLong(brandName),
  };
  return objectKeys(CHECKED_ROWS).filter((field) => isInvalid[field]);
};

export const canSaveLook = (values: TCheckedValues) =>
  !hasArrayGotItems(listInvalidFields(values));

export const lookInvalidControls = (
  values: TCheckedValues,
  fieldIds: Record<TCheckedField, string>,
  revealInvalidField: (row: TLookRow) => void,
) => {
  const invalid = listInvalidFields(values);
  const [first] = invalid;

  return {
    ids: invalid.map((field) => fieldIds[field]),
    revealFirst: () =>
      revealInvalidField(first ? CHECKED_ROWS[first] : LOOK_ROW.BRAND),
  };
};
