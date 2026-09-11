import { createHeroStatementModuleService } from './service';

describe(createHeroStatementModuleService, () => {
  it('exposes v1.getHeroStatement as a function', () => {
    const svc = createHeroStatementModuleService();
    expect(typeof svc.v1.getHeroStatement).toBe('function');
  });
});
