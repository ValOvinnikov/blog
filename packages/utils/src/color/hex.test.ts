import { isHexColor } from './hex';

describe(isHexColor, () => {
  it.each(['#a1b2c3', '#A1B2C3', '#000000'])('accepts %s', (value) => {
    expect(isHexColor(value)).toBe(true);
  });

  it.each(['', '#abc', 'a1b2c3', '#a1b2c3d4', '#12345g', 'red', ' #a1b2c3'])(
    'rejects %j',
    (value) => {
      expect(isHexColor(value)).toBe(false);
    },
  );
});
