import { hasOverflow } from './use-carousel';

describe(hasOverflow.name, () => {
  it('returns false when neither direction can scroll', () => {
    expect(hasOverflow(false, false)).toBe(false);
  });

  it('returns true when the previous direction can scroll', () => {
    expect(hasOverflow(true, false)).toBe(true);
  });

  it('returns true when the next direction can scroll', () => {
    expect(hasOverflow(false, true)).toBe(true);
  });

  it('returns true when both directions can scroll', () => {
    expect(hasOverflow(true, true)).toBe(true);
  });
});
