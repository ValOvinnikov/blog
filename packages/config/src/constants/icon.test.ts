import { FEATURE_ICONS, ICONS } from './icon';

describe('FEATURE_ICONS', () => {
  it('contains only valid ICONS values', () => {
    const validValues = Object.values(ICONS);

    FEATURE_ICONS.forEach((icon) => {
      expect(validValues).toContain(icon);
    });
  });

  it('has no duplicate entries', () => {
    expect(new Set(FEATURE_ICONS).size).toBe(FEATURE_ICONS.length);
  });
});
