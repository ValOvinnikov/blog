import { isNull } from './null';

describe(isNull, () => {
  it('accepts null', () => {
    expect(isNull(null)).toBe(true);
  });

  it.each([[undefined], [''], [0], [false], [{}]])('rejects %j', (value) => {
    expect(isNull(value)).toBe(false);
  });
});
