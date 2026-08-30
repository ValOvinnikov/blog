import { resolveComponent } from './resolve-component';

describe(resolveComponent, () => {
  it('returns the fallback when `as` is undefined', () => {
    expect(resolveComponent(undefined, 'a')).toBe('a');
  });

  it('returns `as` when it is provided', () => {
    expect(resolveComponent('span', 'a')).toBe('span');
  });
});
