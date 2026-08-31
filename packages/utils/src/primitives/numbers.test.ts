import { ceilDivideAtLeastOne } from './numbers';

describe('ceilDivideAtLeastOne', () => {
  it('divides and rounds up', () => {
    expect(ceilDivideAtLeastOne(20, 9)).toBe(3);
    expect(ceilDivideAtLeastOne(18, 9)).toBe(2);
  });

  it('returns 1 for an exact single unit or fewer', () => {
    expect(ceilDivideAtLeastOne(9, 9)).toBe(1);
    expect(ceilDivideAtLeastOne(5, 9)).toBe(1);
  });

  it('returns at least 1 for a zero numerator', () => {
    expect(ceilDivideAtLeastOne(0, 9)).toBe(1);
  });
});
