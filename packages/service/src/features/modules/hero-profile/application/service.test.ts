import { createHeroProfileModuleService } from './service';

describe(createHeroProfileModuleService, () => {
  it('exposes v1.getHeroProfile as a function', () => {
    const svc = createHeroProfileModuleService();
    expect(typeof svc.v1.getHeroProfile).toBe('function');
  });
});
