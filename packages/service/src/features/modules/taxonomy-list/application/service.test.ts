import { createTaxonomyListModuleService } from './service';

describe('createTaxonomyListModuleService', () => {
  it('exposes v1.getTaxonomyList as a function', () => {
    const svc = createTaxonomyListModuleService();
    expect(typeof svc.v1.getTaxonomyList).toBe('function');
  });
});
