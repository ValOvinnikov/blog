import { hasMissingLabel, hasOversizedLabel } from './link-label-checks';
import { LINK_LABEL_MAX_LENGTH } from './link-label-max-length';

describe(hasMissingLabel, () => {
  it('is true for an absent label', () => {
    expect(hasMissingLabel({})).toBe(true);
  });

  it('is true for a whitespace-only label', () => {
    expect(hasMissingLabel({ label: '   ' })).toBe(true);
  });

  it('is false for a real label', () => {
    expect(hasMissingLabel({ label: 'Get started' })).toBe(false);
  });
});

describe(hasOversizedLabel, () => {
  it('is false for a label at the limit', () => {
    expect(
      hasOversizedLabel({ label: 'x'.repeat(LINK_LABEL_MAX_LENGTH) }),
    ).toBe(false);
  });

  it('is true for a label over the limit', () => {
    expect(
      hasOversizedLabel({ label: 'x'.repeat(LINK_LABEL_MAX_LENGTH + 1) }),
    ).toBe(true);
  });

  it('is false for a missing label', () => {
    expect(hasOversizedLabel({})).toBe(false);
  });
});
