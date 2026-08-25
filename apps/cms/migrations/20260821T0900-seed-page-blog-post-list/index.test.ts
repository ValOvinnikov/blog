import { at, createIfNotExists, patch, set } from 'sanity/migrate';

import { toBlogPostListId } from './id';

import migration from './index';

// This migration's own createIfNotExists payload is missing the
// module_postList `title`/`brandVariant` required fields — already applied
// to a live dataset, so the fix landed as a separate backfill migration
// (../20260821T1000-backfill-module-postlist-required-fields) rather than by
// editing this one. Asserting required-fields here would just re-fail on a
// known, already-remediated gap.

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

describe('seed-page-blog-post-list migration', () => {
  it('creates the module_postList doc and sets postList from itemsPerPage', () => {
    const page = {
      ...baseDoc,
      _id: 'page_blog',
      _type: 'page_blog',
      itemsPerPage: 9,
    };

    const postListId = toBlogPostListId(page._id);

    expect(migration.migrate.document(page)).toEqual([
      createIfNotExists({
        _id: postListId,
        _type: 'module_postList',
        pageSize: 9,
        limit: 9,
      }),
      patch(page._id, [
        at('postList', set({ _type: 'reference', _ref: postListId })),
      ]),
    ]);
  });

  it('lands a draft page_blog on the draft module_postList sibling', () => {
    const page = {
      ...baseDoc,
      _id: 'drafts.page_blog',
      _type: 'page_blog',
      itemsPerPage: 12,
    };

    const postListId = toBlogPostListId(page._id);

    expect(migration.migrate.document(page)).toEqual([
      createIfNotExists({
        _id: postListId,
        _type: 'module_postList',
        pageSize: 12,
        limit: 12,
      }),
      patch(page._id, [
        at('postList', set({ _type: 'reference', _ref: postListId })),
      ]),
    ]);
  });

  it('is idempotent — a page_blog with postList already set is left alone', () => {
    const page = {
      ...baseDoc,
      _id: 'page_blog',
      _type: 'page_blog',
      itemsPerPage: 9,
      postList: { _type: 'reference', _ref: 'postList-blog' },
    };

    expect(migration.migrate.document(page)).toBeUndefined();
  });
});
