import { makeRawTagWithPostCount } from '@blog/service/testing/entities/fixtures';

import { tagsQuery } from './query';

describe('tagsQuery', () => {
  it('parses a tag with a post count', () => {
    const raw = [makeRawTagWithPostCount({ postCount: 5 })];

    expect(() => tagsQuery.parse(raw)).not.toThrow();
  });

  it('parses a tag with no description', () => {
    const raw = [makeRawTagWithPostCount({ description: null, postCount: 5 })];

    expect(() => tagsQuery.parse(raw)).not.toThrow();
  });

  it('reads the title and description in the requested language, falling back to the default language', () => {
    expect(tagsQuery.query).toContain(
      'coalesce(title[][language == $locale][0].value, title[][language == $defaultLocale][0].value)',
    );
    expect(tagsQuery.query).toContain(
      'coalesce(description[][language == $locale][0].value, description[][language == $defaultLocale][0].value)',
    );
  });

  it('orders tags by their title in the requested language', () => {
    expect(tagsQuery.query).toMatch(/\} \| order\(title asc\)$/);
  });

  it('correlates the post count to the enclosing tag document', () => {
    expect(tagsQuery.query).toContain('references(^._id)');
  });

  it('excludes future-dated posts from the post count', () => {
    expect(tagsQuery.query).toContain('publishedAt <= now()');
  });

  it('counts only page posts', () => {
    expect(tagsQuery.query).toContain('_type == "page_post"');
  });
});
