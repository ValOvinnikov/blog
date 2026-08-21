import { at, createIfNotExists, set } from 'sanity/migrate';

import { toPostLatestId } from './id';

import migration from './index';

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

describe('create-module-post-latest-from-post-list migration', () => {
  describe('module_postList documents', () => {
    it('creates a module_postLatest under toPostLatestId(doc._id), carrying its fields', () => {
      const postList = {
        ...baseDoc,
        _id: 'abc123',
        _type: 'module_postList',
        title: 'Latest Posts',
        brandVariant: 'PRIMARY',
        sectionHeader: { heading: 'From the blog' },
        limit: 3,
        layout: { spacing: 'DEFAULT' },
      };

      expect(migration.migrate.document(postList)).toEqual([
        createIfNotExists({
          _id: toPostLatestId(postList._id),
          _type: 'module_postLatest',
          title: postList.title,
          brandVariant: postList.brandVariant,
          sectionHeader: postList.sectionHeader,
          limit: postList.limit,
          layout: postList.layout,
        }),
      ]);
    });

    it("clamps limit to the target schema's max when the source exceeds it", () => {
      const postList = {
        ...baseDoc,
        _id: 'abc123',
        _type: 'module_postList',
        title: 'Latest Posts',
        limit: 24,
      };

      expect(migration.migrate.document(postList)).toEqual([
        createIfNotExists({
          _id: toPostLatestId(postList._id),
          _type: 'module_postLatest',
          title: postList.title,
          brandVariant: undefined,
          sectionHeader: undefined,
          limit: 12,
          layout: undefined,
        }),
      ]);
    });

    it('lands a draft module_postList on the draft module_postLatest sibling', () => {
      const postList = {
        ...baseDoc,
        _id: 'drafts.abc123',
        _type: 'module_postList',
        title: 'Latest Posts',
        limit: 3,
      };

      expect(migration.migrate.document(postList)).toEqual([
        createIfNotExists({
          _id: 'drafts.postLatest-abc123',
          _type: 'module_postLatest',
          title: postList.title,
          brandVariant: undefined,
          sectionHeader: undefined,
          limit: postList.limit,
          layout: undefined,
        }),
      ]);
    });
  });

  describe('page_home documents', () => {
    it('repoints a module_postList item in modules[] onto the new module_postLatest document', () => {
      const page = {
        ...baseDoc,
        _id: 'page_home',
        _type: 'page_home',
        modules: [
          { _key: 'key1', _type: 'module_postList', _ref: 'abc123' },
          { _key: 'key2', _type: 'module_cta', _ref: 'cta-1' },
        ],
      };

      expect(migration.migrate.document(page)).toEqual([
        at(
          ['modules', { _key: 'key1' }],
          set({
            _key: 'key1',
            _type: 'module_postLatest',
            _ref: toPostLatestId('abc123'),
          }),
        ),
      ]);
    });

    it('repoints every module_postList item when modules[] has more than one', () => {
      const page = {
        ...baseDoc,
        _id: 'page_home',
        _type: 'page_home',
        modules: [
          { _key: 'key1', _type: 'module_postList', _ref: 'abc123' },
          { _key: 'key2', _type: 'module_cta', _ref: 'cta-1' },
          { _key: 'key3', _type: 'module_postList', _ref: 'def456' },
        ],
      };

      expect(migration.migrate.document(page)).toEqual([
        at(
          ['modules', { _key: 'key1' }],
          set({
            _key: 'key1',
            _type: 'module_postLatest',
            _ref: toPostLatestId('abc123'),
          }),
        ),
        at(
          ['modules', { _key: 'key3' }],
          set({
            _key: 'key3',
            _type: 'module_postLatest',
            _ref: toPostLatestId('def456'),
          }),
        ),
      ]);
    });

    it('produces no patches for a page_home with no module_postList item', () => {
      const page = {
        ...baseDoc,
        _id: 'page_home',
        _type: 'page_home',
        modules: [{ _key: 'key2', _type: 'module_cta', _ref: 'cta-1' }],
      };

      expect(migration.migrate.document(page)).toBeUndefined();
    });

    it('produces no patches for a page_home with no modules field', () => {
      const page = { ...baseDoc, _id: 'page_home', _type: 'page_home' };

      expect(migration.migrate.document(page)).toBeUndefined();
    });

    it('is idempotent — an already-migrated page_home (module_postLatest item) is left alone', () => {
      const page = {
        ...baseDoc,
        _id: 'page_home',
        _type: 'page_home',
        modules: [
          {
            _key: 'key1',
            _type: 'module_postLatest',
            _ref: toPostLatestId('abc123'),
          },
        ],
      };

      expect(migration.migrate.document(page)).toBeUndefined();
    });
  });
});
