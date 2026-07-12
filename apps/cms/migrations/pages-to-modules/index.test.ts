import { at, set, unset } from 'sanity/migrate';
import { describe, expect, it } from 'vitest';

import migration from './index';

const migrateDocument = (doc: Record<string, unknown>) =>
  migration.migrate.document?.(doc as never);

describe('pages-to-modules migration', () => {
  describe('homePage', () => {
    it('wraps the flat hero and latest-posts fields into modules[]', () => {
      const legacyHomePage = {
        _id: 'homePage',
        _type: 'homePage',
        title: 'Home Page',
        featuredPost: { _type: 'reference', _ref: 'post-1' },
        heroEyebrowMode: 'postCategory',
        heroTitleMode: 'custom',
        heroTitle: 'Custom title',
        heroSubtitleMode: 'postExcerpt',
        heroImageMode: 'postImage',
        primaryActionLabel: 'Read more',
        secondaryAction: { linkType: 'EXTERNAL', url: '/blog' },
        latestPostsTitle: 'Latest',
        latestPostsLimit: 6,
      };

      const result = migrateDocument(legacyHomePage);

      expect(result).toEqual([
        at(
          'modules',
          set([
            {
              _type: 'module_hero',
              _key: 'hero',
              featuredPost: { _type: 'reference', _ref: 'post-1' },
              heroEyebrowMode: 'postCategory',
              heroTitleMode: 'custom',
              heroTitle: 'Custom title',
              heroSubtitleMode: 'postExcerpt',
              heroImageMode: 'postImage',
              primaryActionLabel: 'Read more',
              secondaryAction: { linkType: 'EXTERNAL', url: '/blog' },
            },
            {
              _type: 'module_postList',
              _key: 'postList',
              title: 'Latest',
              limit: 6,
            },
          ]),
        ),
        at('featuredPost', unset()),
        at('heroEyebrowMode', unset()),
        at('heroEyebrow', unset()),
        at('heroTitleMode', unset()),
        at('heroTitle', unset()),
        at('heroSubtitleMode', unset()),
        at('heroSubtitle', unset()),
        at('heroImageMode', unset()),
        at('heroImage', unset()),
        at('primaryActionLabel', unset()),
        at('secondaryAction', unset()),
        at('latestPostsTitle', unset()),
        at('latestPostsLimit', unset()),
      ]);
    });

    it('is a no-op when modules[] is already present', () => {
      const migratedHomePage = {
        _id: 'homePage',
        _type: 'homePage',
        title: 'Home Page',
        modules: [
          { _type: 'module_hero', _key: 'hero' },
          { _type: 'module_postList', _key: 'postList', title: 'Latest' },
        ],
      };

      expect(migrateDocument(migratedHomePage)).toBeUndefined();
    });

    it('is a no-op when modules[] is present alongside leftover legacy fields', () => {
      const partiallyMigratedHomePage = {
        _id: 'homePage',
        _type: 'homePage',
        title: 'Home Page',
        modules: [{ _type: 'module_hero', _key: 'hero' }],
        heroEyebrowMode: 'postCategory',
        latestPostsTitle: 'Latest',
      };

      expect(migrateDocument(partiallyMigratedHomePage)).toBeUndefined();
    });
  });

  describe('page', () => {
    it('wraps body into a module_content and unsets body', () => {
      const legacyPage = {
        _id: 'page-1',
        _type: 'page',
        title: 'About',
        body: [{ _type: 'block', _key: 'b1', children: [] }],
      };

      const result = migrateDocument(legacyPage);

      expect(result).toEqual([
        at(
          'modules',
          set([
            {
              _type: 'module_content',
              _key: 'content',
              body: [{ _type: 'block', _key: 'b1', children: [] }],
            },
          ]),
        ),
        at('body', unset()),
      ]);
    });

    it('is a no-op when there is no body to migrate', () => {
      const pageWithoutBody = {
        _id: 'page-2',
        _type: 'page',
        title: 'Empty',
      };

      expect(migrateDocument(pageWithoutBody)).toBeUndefined();
    });

    it('is a no-op when modules[] is already present', () => {
      const migratedPage = {
        _id: 'page-3',
        _type: 'page',
        title: 'Migrated',
        modules: [{ _type: 'module_content', _key: 'content', body: [] }],
      };

      expect(migrateDocument(migratedPage)).toBeUndefined();
    });

    it('is a no-op when modules[] is present alongside a leftover body', () => {
      const partiallyMigratedPage = {
        _id: 'page-4',
        _type: 'page',
        title: 'Partially migrated',
        modules: [{ _type: 'module_content', _key: 'content', body: [] }],
        body: [{ _type: 'block', _key: 'stale', children: [] }],
      };

      expect(migrateDocument(partiallyMigratedPage)).toBeUndefined();
    });
  });

  it('returns undefined for other document types', () => {
    const otherDoc = { _id: 'author-1', _type: 'author', name: 'Jane' };

    expect(migrateDocument(otherDoc)).toBeUndefined();
  });
});
