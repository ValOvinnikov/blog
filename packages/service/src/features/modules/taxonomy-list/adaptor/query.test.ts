import { makeRawTaxonomyListModule } from '@blog/service/testing/modules/fixtures';

import { taxonomyListModuleQuery } from './query';

describe('taxonomyListModuleQuery', () => {
  it('filters to module_taxonomyList documents by id', () => {
    expect(taxonomyListModuleQuery.query).toContain(
      '_type == "module_taxonomyList"',
    );
    expect(taxonomyListModuleQuery.query).toContain('_id == $id');
  });

  it('does not project an emptyMessage field', () => {
    expect(taxonomyListModuleQuery.query).not.toContain('emptyMessage');
  });

  it('parses a module with no sectionHeader/layout set', () => {
    const raw = makeRawTaxonomyListModule({
      sectionHeader: null,
      layout: null,
    });

    expect(() => taxonomyListModuleQuery.parse(raw)).not.toThrow();
  });

  it('projects contentAlignment', () => {
    expect(taxonomyListModuleQuery.query).toContain('contentAlignment');
  });
});
