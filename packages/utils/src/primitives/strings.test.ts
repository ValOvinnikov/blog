import { isString } from './strings';

describe(isString, () => {
  it.each([['abc'], ['']])('accepts the string %j', (value) => {
    expect(isString(value)).toBe(true);
  });

  it.each([[undefined], [null], [42], [['abc']]])('rejects %j', (value) => {
    expect(isString(value)).toBe(false);
  });
});
