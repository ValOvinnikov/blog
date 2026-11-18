import { toAdditionalLanguages, toLocaleLimit } from './locale-limit';

describe('locale limit', () => {
  it.each([0, 1, 4])('round-trips %i additional languages', (additional) => {
    expect(toAdditionalLanguages(toLocaleLimit(additional))).toBe(additional);
  });

  it('counts the default language in the limit', () => {
    expect(toLocaleLimit(0)).toBeGreaterThan(0);
  });
});
