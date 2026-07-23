import { createHeroModuleService } from './service';

describe('createHeroModuleService', () => {
  it('exposes v1.getHero as a function', () => {
    const svc = createHeroModuleService();
    expect(typeof svc.v1.getHero).toBe('function');
  });
});
