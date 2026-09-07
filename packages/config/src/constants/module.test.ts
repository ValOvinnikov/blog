import { isHeroModuleType } from './module';

describe('isHeroModuleType', () => {
  it('matches a hero module type', () => {
    expect(isHeroModuleType('module_hero')).toBe(true);
  });

  it('rejects a non-hero module type', () => {
    expect(isHeroModuleType('module_cta')).toBe(false);
  });

  it('rejects a non-module string', () => {
    expect(isHeroModuleType('page_home')).toBe(false);
  });
});
