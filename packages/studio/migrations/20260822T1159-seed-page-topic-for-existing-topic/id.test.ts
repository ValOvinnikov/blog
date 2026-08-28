import { toPageTopicId, toTopicPostListId } from './id';

describe('toPageTopicId', () => {
  it('prefixes a published blog_topic id', () => {
    expect(toPageTopicId('abc123')).toBe('page_topic-abc123');
  });

  it('keeps the drafts. prefix outermost', () => {
    expect(toPageTopicId('drafts.abc123')).toBe('drafts.page_topic-abc123');
  });

  it('is idempotent for an already-migrated id', () => {
    expect(toPageTopicId('page_topic-abc123')).toBe('page_topic-abc123');
  });
});

describe('toTopicPostListId', () => {
  it('prefixes a published blog_topic id', () => {
    expect(toTopicPostListId('abc123')).toBe('postList-topic-abc123');
  });

  it('keeps the drafts. prefix outermost', () => {
    expect(toTopicPostListId('drafts.abc123')).toBe(
      'drafts.postList-topic-abc123',
    );
  });

  it('is idempotent for an already-migrated id', () => {
    expect(toTopicPostListId('postList-topic-abc123')).toBe(
      'postList-topic-abc123',
    );
  });

  it('produces distinct ids from toPageTopicId for the same topic', () => {
    expect(toTopicPostListId('abc123')).not.toBe(toPageTopicId('abc123'));
  });
});
