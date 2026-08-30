import { at, unset } from 'sanity/migrate';

import { removeRetiredPostListLimitFields } from './index';

describe(removeRetiredPostListLimitFields, () => {
  it('unsets page_blog.itemsPerPage when present', () => {
    const result = removeRetiredPostListLimitFields('page_blog', {
      itemsPerPage: 9,
    });

    expect(result).toEqual([at('itemsPerPage', unset())]);
  });

  it('is a no-op for a page_blog doc that never had itemsPerPage', () => {
    const result = removeRetiredPostListLimitFields('page_blog', {});

    expect(result).toBeUndefined();
  });

  it('is idempotent for an already-migrated page_blog doc', () => {
    const result = removeRetiredPostListLimitFields('page_blog', {
      itemsPerPage: undefined,
    });

    expect(result).toBeUndefined();
  });

  it('unsets module_postList.limit when present', () => {
    const result = removeRetiredPostListLimitFields('module_postList', {
      limit: 12,
    });

    expect(result).toEqual([at('limit', unset())]);
  });

  it('is a no-op for a module_postList doc that never had limit', () => {
    const result = removeRetiredPostListLimitFields('module_postList', {});

    expect(result).toBeUndefined();
  });

  it('is idempotent for an already-migrated module_postList doc', () => {
    const result = removeRetiredPostListLimitFields('module_postList', {
      limit: undefined,
    });

    expect(result).toBeUndefined();
  });
});
