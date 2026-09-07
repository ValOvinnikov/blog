import { createHeroBlogModuleService } from './service';

describe(createHeroBlogModuleService, () => {
  it('exposes v1.getHeroBlog as a function', () => {
    const svc = createHeroBlogModuleService();
    expect(typeof svc.v1.getHeroBlog).toBe('function');
  });
});
