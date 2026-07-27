import { postParamsQuery } from './query';

describe('postParamsQuery', () => {
  it('parses a slug and publishedAt', () => {
    const raw = [{ slug: 'hello-world', publishedAt: '2026-01-01T00:00:00Z' }];

    expect(() => postParamsQuery.parse(raw)).not.toThrow();
  });

  it('excludes posts whose publishedAt is in the future', () => {
    expect(postParamsQuery.query).toContain('publishedAt <= now()');
  });
});
