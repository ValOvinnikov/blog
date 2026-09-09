import { heroBlogModuleQuery } from './query';

describe('heroBlogModuleQuery', () => {
  it('resolves the post with select(), not coalesce(), branching on postSource', () => {
    expect(heroBlogModuleQuery.query).toContain(
      'select( postSource == "PINNED" =>',
    );
    expect(heroBlogModuleQuery.query).not.toContain('coalesce(post->');
  });

  it('falls back to the newest published featured post when postSource is not PINNED', () => {
    expect(heroBlogModuleQuery.query).toContain(
      '*[_type == "page_post"][featured == true][publishedAt <= now() && defined(sectionHeader.heading)] | order(publishedAt desc)[0]',
    );
  });

  it('projects the post through the shared post-card fragment', () => {
    expect(heroBlogModuleQuery.query).toContain('"slug": slug.current');
    expect(heroBlogModuleQuery.query).toContain('"topic": topic->');
  });
});
