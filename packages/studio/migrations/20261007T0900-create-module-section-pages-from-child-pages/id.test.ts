import { toSectionPagesId } from './id';

describe(toSectionPagesId, () => {
  it('prefixes a published module_childPages id', () => {
    expect(toSectionPagesId('abc123')).toBe('sectionPages-abc123');
  });

  it('keeps the drafts. prefix outermost', () => {
    expect(toSectionPagesId('drafts.abc123')).toBe(
      'drafts.sectionPages-abc123',
    );
  });

  it('is idempotent for an already-migrated id', () => {
    expect(toSectionPagesId('sectionPages-abc123')).toBe('sectionPages-abc123');
  });
});
