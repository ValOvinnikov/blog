import { isUndefined } from '@blog/utils/primitives';

type TSingleSelectOptions = {
  isLocked?: boolean;
};

/** Base UI's Toggle Group deselects on a re-click of the pressed item; with no "none selected" state, that click is swallowed. */
export const singleSelectToggleGroupProps = <TValue extends string>(
  value: TValue,
  onChange: (value: TValue) => void,
  { isLocked = false }: TSingleSelectOptions = {},
) => ({
  value: [value],
  onValueChange: (nextValues: TValue[]) => {
    const nextValue = nextValues[0];
    if (!isLocked && !isUndefined(nextValue)) {
      onChange(nextValue);
    }
  },
});
