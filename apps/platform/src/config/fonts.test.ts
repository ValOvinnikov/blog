import { FONT_OPTIONS } from './fonts';

describe('FONT_OPTIONS', () => {
  it('resolves each option to its own loaded webfont family', () => {
    const families = Object.values(FONT_OPTIONS).map(
      (option) => option.fontFamily,
    );

    expect(new Set(families).size).toBe(families.length);
  });
});
