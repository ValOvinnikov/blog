import { toPersonId } from './id';

describe(toPersonId, () => {
  it('prefixes a published blog_author id', () => {
    expect(toPersonId('abc123')).toBe('person-abc123');
  });

  it('keeps the drafts. prefix outermost', () => {
    expect(toPersonId('drafts.abc123')).toBe('drafts.person-abc123');
  });

  it('is idempotent for an already-migrated id', () => {
    expect(toPersonId('person-abc123')).toBe('person-abc123');
  });
});
