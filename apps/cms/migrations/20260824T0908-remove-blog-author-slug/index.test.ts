import { at, unset } from 'sanity/migrate';

import { removeBlogAuthorSlug } from './index';

describe(removeBlogAuthorSlug, () => {
  it('unsets slug when present', () => {
    const result = removeBlogAuthorSlug({
      slug: { _type: 'slug', current: 'jane-doe' },
    });

    expect(result).toEqual([at('slug', unset())]);
  });

  it('is a no-op for a doc that never had slug', () => {
    const result = removeBlogAuthorSlug({});

    expect(result).toBeUndefined();
  });

  it('is idempotent — a doc already migrated is left alone', () => {
    const result = removeBlogAuthorSlug({ slug: undefined });

    expect(result).toBeUndefined();
  });
});
