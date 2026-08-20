import { toTopicId } from './id';

describe('toTopicId', () => {
  it('prefixes a published category id', () => {
    expect(toTopicId('abc123')).toBe('topic-abc123');
  });

  it('keeps the drafts. prefix outermost', () => {
    expect(toTopicId('drafts.abc123')).toBe('drafts.topic-abc123');
  });

  it('is idempotent for an already-migrated id', () => {
    expect(toTopicId('topic-abc123')).toBe('topic-abc123');
  });
});
