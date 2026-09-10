import { postRelatedModuleQuery } from './query';

describe('postRelatedModuleQuery', () => {
  it('filters to module_postRelated documents by id', () => {
    expect(postRelatedModuleQuery.query).toContain(
      '_type == "module_postRelated"',
    );
    expect(postRelatedModuleQuery.query).toContain('_id == $id');
  });

  it('projects brandVariant and limit', () => {
    expect(postRelatedModuleQuery.query).toContain('brandVariant');
    expect(postRelatedModuleQuery.query).toContain('limit');
  });

  it('coalesces showImages to true for documents authored before the field existed', () => {
    expect(postRelatedModuleQuery.query).toContain(
      'coalesce(showImages, true)',
    );
  });
});
