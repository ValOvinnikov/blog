import { createFeatureListModuleService } from './service';

describe('createFeatureListModuleService', () => {
  it('exposes v1.getFeatureList as a function', () => {
    const svc = createFeatureListModuleService();
    expect(typeof svc.v1.getFeatureList).toBe('function');
  });
});
