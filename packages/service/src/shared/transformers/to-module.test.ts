import { InvalidHeroModuleTypeError, toHeroSlot, toModule } from './to-module';

describe('toModule', () => {
  it('maps a raw module reference to its id/type', () => {
    expect(toModule({ _id: 'cta-1', _type: 'module_cta' })).toEqual({
      id: 'cta-1',
      type: 'module_cta',
    });
  });
});

describe('toHeroSlot', () => {
  it('maps a module_hero* reference to a hero slot', () => {
    expect(toHeroSlot({ _id: 'hero-1', _type: 'module_hero' })).toEqual({
      id: 'hero-1',
      type: 'module_hero',
    });
  });

  it('throws InvalidHeroModuleTypeError when the reference is not a hero type', () => {
    expect(() => toHeroSlot({ _id: 'cta-1', _type: 'module_cta' })).toThrow(
      InvalidHeroModuleTypeError,
    );
  });

  it('returns undefined when the reference is null', () => {
    expect(toHeroSlot(null)).toBeUndefined();
  });

  it('returns undefined when the reference is undefined', () => {
    expect(toHeroSlot(undefined)).toBeUndefined();
  });
});
