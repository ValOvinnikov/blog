import { heroProfileModuleQuery } from './query';

describe('heroProfileModuleQuery', () => {
  it('filters to module_heroProfile documents by id', () => {
    expect(heroProfileModuleQuery.query).toContain(
      '_type == "module_heroProfile"',
    );
    expect(heroProfileModuleQuery.query).toContain('_id == $id');
  });

  it('coalesces showSocialLinks to true for documents authored before the field existed', () => {
    expect(heroProfileModuleQuery.query).toContain(
      'coalesce(showSocialLinks, true)',
    );
  });

  it('derefs the author reference', () => {
    expect(heroProfileModuleQuery.query).toContain('author->');
  });

  it("projects the author's name for the avatar fallback", () => {
    expect(heroProfileModuleQuery.query).toContain('name');
  });
});
