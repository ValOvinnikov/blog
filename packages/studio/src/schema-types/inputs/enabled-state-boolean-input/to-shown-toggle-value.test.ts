import { toShownToggleValue } from '@shinefold/studio/schema-types/inputs/enabled-state-boolean-input/to-shown-toggle-value';

describe(toShownToggleValue, () => {
  it.each([
    ['keeps a stored false over an initial value of true', false, true, false],
    ['shows a boolean initial value while unset', undefined, true, true],
    ['leaves a function initial value unset', undefined, () => true, undefined],
    [
      'leaves a field with no initial value unset',
      undefined,
      undefined,
      undefined,
    ],
  ])('%s', (_description, value, initialValue, expected) => {
    expect(toShownToggleValue(value, initialValue)).toBe(expected);
  });
});
