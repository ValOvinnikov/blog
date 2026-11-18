import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';
import { isBrandNameTooLong } from '@platform/utils/brand-name/brand-name';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { isAccentHueAccessible } from '@shinefold/config';

type TCheckedValues = Pick<TLookFormValues, 'accentHue' | 'brandName'>;

export const canSaveLook = ({ accentHue, brandName }: TCheckedValues) =>
  isAccentHueAccessible(accentHue) && !isBrandNameTooLong(brandName);

export const lookInvalidControls = (
  { accentHue, brandName }: TCheckedValues,
  fieldIds: { accentHue: string; brandName: string },
  revealInvalidField: (row: TLookRow) => void,
) => {
  const isHueRejected = !isAccentHueAccessible(accentHue);
  const isNameTooLong = isBrandNameTooLong(brandName);

  return {
    ids: [
      ...(isHueRejected ? [fieldIds.accentHue] : []),
      ...(isNameTooLong ? [fieldIds.brandName] : []),
    ],
    revealFirst: () =>
      revealInvalidField(isHueRejected ? LOOK_ROW.COLOUR : LOOK_ROW.BRAND),
  };
};
