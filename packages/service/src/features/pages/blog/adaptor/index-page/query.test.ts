import { makeRawTopic } from '@blog/service/testing/entities/fixtures';
import {
  makeRawArchivePostCard,
  makeRawBlogPage,
} from '@blog/service/testing/pages/fixtures';

import { blogPageQuery, buildIndexPageQuery } from './query';

describe('blogPageQuery', () => {
  it('parses a blog page with no supporting text and no SEO', () => {
    const raw = makeRawBlogPage({ supportingText: null, seo: null });

    expect(() => blogPageQuery.parse(raw)).not.toThrow();
  });
});

describe('buildIndexPageQuery', () => {
  it('parses posts whose optional card fields are all absent', () => {
    const raw = {
      posts: [
        makeRawArchivePostCard({
          topic: makeRawTopic({ description: null }),
        }),
      ],
      total: 1,
    };

    expect(() => buildIndexPageQuery(0, 9).parse(raw)).not.toThrow();
  });

  it('excludes posts whose publishedAt is in the future', () => {
    expect(buildIndexPageQuery(0, 9).query).toContain('publishedAt <= now()');
  });
});
