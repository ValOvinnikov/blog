import { postListModuleQuery } from './query';

describe('postListModuleQuery', () => {
  it('filters to module_postList documents by id', () => {
    expect(postListModuleQuery.query).toContain('_type == "module_postList"');
    expect(postListModuleQuery.query).toContain('_id == $id');
  });

  it('projects the archive pageSize, not the retired limit field', () => {
    expect(postListModuleQuery.query).toContain('pageSize');
    expect(postListModuleQuery.query).not.toContain('limit');
  });
});
