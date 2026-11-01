/** Base UI's Toggle Group deselects on a re-click of the pressed item; with no "none selected" state, that click is swallowed. */
export const singleSelectToggleGroupProps = <TValue extends string>(
  value: TValue,
  onChange: (value: TValue) => void,
) => ({
  value: [value],
  onValueChange: (nextValues: TValue[]) => {
    const nextValue = nextValues[0];
    if (nextValue !== undefined) {
      onChange(nextValue);
    }
  },
});
