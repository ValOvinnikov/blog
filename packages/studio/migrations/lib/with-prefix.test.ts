import { withPrefix } from './with-prefix';

describe(withPrefix, () => {
  it('prefixes a bare id', () => {
    expect(withPrefix('abc123', 'page_topic-')).toBe('page_topic-abc123');
  });

  it('keeps the drafts. prefix outermost', () => {
    expect(withPrefix('drafts.abc123', 'page_topic-')).toBe(
      'drafts.page_topic-abc123',
    );
  });

  it('is idempotent for an already-prefixed id', () => {
    expect(withPrefix('page_topic-abc123', 'page_topic-')).toBe(
      'page_topic-abc123',
    );
  });

  it('is idempotent for an already-prefixed draft id', () => {
    expect(withPrefix('drafts.page_topic-abc123', 'page_topic-')).toBe(
      'drafts.page_topic-abc123',
    );
  });
});
