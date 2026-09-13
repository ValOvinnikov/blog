import { makeRawPostListModule } from '@blog/service/testing/modules/fixtures';

import { postListModuleQuery } from './query';

describe('postListModuleQuery', () => {
  it('filters to module_postList documents by id', () => {
    expect(postListModuleQuery.query).toContain('_type == "module_postList"');
    expect(postListModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawPostListModule(), headingBlock: null };

    expect(() => postListModuleQuery.parse(raw)).toThrow();
  });

  it('projects the archive pageSize, not the retired limit field', () => {
    expect(postListModuleQuery.query).toContain('pageSize');
    expect(postListModuleQuery.query).not.toContain('limit');
  });

  it('projects contentAlignment', () => {
    expect(postListModuleQuery.query).toContain('contentAlignment');
  });

  it('coalesces showImages to true for documents authored before the field existed', () => {
    expect(postListModuleQuery.query).toContain('coalesce(showImages, true)');
  });
});
