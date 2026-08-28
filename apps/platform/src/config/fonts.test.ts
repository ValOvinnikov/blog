import { FONT_CHOICE } from '@blog/config';

import { FONT_OPTIONS } from './fonts';

describe('FONT_OPTIONS', () => {
  it('carries an entry for every closed-set FONT_CHOICE value', () => {
    expect(Object.keys(FONT_OPTIONS).sort()).toEqual(
      Object.values(FONT_CHOICE).sort(),
    );
  });

  it('resolves each option to its own loaded webfont family, not a shared fallback', () => {
    const families = Object.values(FONT_OPTIONS).map(
      (option) => option.fontFamily,
    );

    expect(new Set(families).size).toBe(families.length);
  });

  it('labels Fraunces by its real name', () => {
    expect(FONT_OPTIONS[FONT_CHOICE.FRAUNCES].label).toBe('Fraunces');
  });
});
