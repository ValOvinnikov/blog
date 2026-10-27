import { isHeroModuleType } from './module';

describe(isHeroModuleType, () => {
  it('matches a hero module type', () => {
    expect(isHeroModuleType('module_hero')).toBe(true);
  });

  it.each(['module_cta', 'page_home'])('rejects %s', (type) => {
    expect(isHeroModuleType(type)).toBe(false);
  });
});
