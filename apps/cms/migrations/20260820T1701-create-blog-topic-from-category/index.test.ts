import { at, createIfNotExists, set, unset } from 'sanity/migrate';

import { toTopicId } from './id';

import migration from './index';

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

describe('create-blog-topic-from-category migration', () => {
  describe('blog_category documents', () => {
    it('creates a blog_topic under toTopicId(doc._id), carrying title/slug/description', () => {
      const category = {
        ...baseDoc,
        _id: 'abc123',
        _type: 'blog_category',
        title: 'Design',
        slug: { _type: 'slug', current: 'design' },
        description: 'Posts about design.',
      };

      expect(migration.migrate.document(category)).toEqual([
        createIfNotExists({
          _id: toTopicId(category._id),
          _type: 'blog_topic',
          title: category.title,
          slug: category.slug,
          description: category.description,
        }),
      ]);
    });

    it('lands a draft category on the draft topic sibling', () => {
      const category = {
        ...baseDoc,
        _id: 'drafts.abc123',
        _type: 'blog_category',
        title: 'Design',
      };

      expect(migration.migrate.document(category)).toEqual([
        createIfNotExists({
          _id: 'drafts.topic-abc123',
          _type: 'blog_topic',
          title: category.title,
          slug: undefined,
          description: undefined,
        }),
      ]);
    });
  });

  describe('blog_post documents', () => {
    it('repoints a category reference onto the new topic and unsets category', () => {
      const post = {
        ...baseDoc,
        _id: 'post-1',
        _type: 'blog_post',
        category: { _type: 'reference', _ref: 'abc123' },
      };

      expect(migration.migrate.document(post)).toEqual([
        at('topic', set({ _type: 'reference', _ref: toTopicId('abc123') })),
        at('category', unset()),
      ]);
    });

    it('produces no patches for a post with no category reference', () => {
      const post = { ...baseDoc, _id: 'post-2', _type: 'blog_post' };

      expect(migration.migrate.document(post)).toBeUndefined();
    });

    it('is idempotent — an already-migrated post (no category field) is left alone', () => {
      const post = {
        ...baseDoc,
        _id: 'post-3',
        _type: 'blog_post',
        topic: { _type: 'reference', _ref: toTopicId('abc123') },
      };

      expect(migration.migrate.document(post)).toBeUndefined();
    });
  });
});
