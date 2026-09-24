import { q } from '@blog/service/sanity/query';

import { postLinkFragment } from './post-link';

const postLinkDocQuery = q.star
  .filterByType('page_post')
  .slice(0)
  .project(postLinkFragment);

describe('postLinkFragment', () => {
  it('accepts a fully-projected post (heading and flattened slug.current present)', () => {
    const projected = {
      _id: 'post-1',
      headingBlock: { heading: 'Hello World' },
      slug: 'hello-world',
    };

    expect(postLinkDocQuery.parse(projected)).toEqual(projected);
  });

  it('throws when the required heading is missing', () => {
    const projected = {
      _id: 'post-2',
      headingBlock: { heading: null },
      slug: 'no-heading',
    };

    expect(() => postLinkDocQuery.parse(projected)).toThrow();
  });

  it('throws when the required slug is missing', () => {
    const projected = {
      _id: 'post-3',
      headingBlock: { heading: 'Has Heading' },
      slug: null,
    };

    expect(() => postLinkDocQuery.parse(projected)).toThrow();
  });

  it('projects only _id, headingBlock.heading and slug.current', () => {
    expect(postLinkDocQuery.query).not.toContain('wordCount');
    expect(postLinkDocQuery.query).not.toContain('publishedAt');
    expect(postLinkDocQuery.query).not.toContain('supportingText');
  });
});
