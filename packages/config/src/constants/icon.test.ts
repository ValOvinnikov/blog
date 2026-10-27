import { FEATURE_ICONS, ICONS } from './icon';

describe('FEATURE_ICONS', () => {
  it('contains only valid ICONS values', () => {
    const validValues: readonly string[] = Object.values(ICONS);

    const invalid = FEATURE_ICONS.filter((icon) => !validValues.includes(icon));

    expect(invalid).toEqual([]);
  });

  it('has no duplicate entries', () => {
    expect(new Set(FEATURE_ICONS).size).toBe(FEATURE_ICONS.length);
  });
});
