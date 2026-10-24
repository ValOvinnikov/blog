import { isUndefined } from './nullish';

describe(isUndefined, () => {
  it('accepts undefined', () => {
    expect(isUndefined(undefined)).toBe(true);
  });

  it.each([[null], [0], [''], [false], [Number.NaN]])('rejects %j', (value) => {
    expect(isUndefined(value)).toBe(false);
  });
});
