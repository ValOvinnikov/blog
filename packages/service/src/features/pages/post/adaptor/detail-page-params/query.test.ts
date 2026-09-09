import { postParamsQuery } from './query';

describe('postParamsQuery', () => {
  it('filters to page_post documents', () => {
    expect(postParamsQuery.query).toContain('_type == "page_post"');
  });

  it('parses a slug and publishedAt', () => {
    const raw = [{ slug: 'hello-world', publishedAt: '2026-01-01T00:00:00Z' }];

    expect(() => postParamsQuery.parse(raw)).not.toThrow();
  });

  it('excludes page_post documents whose publishedAt is in the future', () => {
    expect(postParamsQuery.query).toContain('publishedAt <= now()');
  });
});
