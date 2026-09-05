import { postLatestModuleQuery } from './query';

describe('postLatestModuleQuery', () => {
  it('filters to module_postLatest documents by id', () => {
    expect(postLatestModuleQuery.query).toContain(
      '_type == "module_postLatest"',
    );
    expect(postLatestModuleQuery.query).toContain('_id == $id');
  });

  it('projects contentAlignment', () => {
    expect(postLatestModuleQuery.query).toContain('contentAlignment');
  });
});
