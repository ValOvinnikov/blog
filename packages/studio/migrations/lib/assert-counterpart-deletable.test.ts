import type { MigrationContext } from 'sanity/migrate';

import { assertCounterpartDeletable } from './assert-counterpart-deletable';

const createContext = (result: {
  target: Record<string, unknown> | null;
  refCount: number;
}): MigrationContext => {
  const fetch = async () => result;

  return { client: { fetch } } as unknown as MigrationContext;
};

const hasContent = (content: unknown): boolean =>
  Array.isArray(content) ? content.length > 0 : Boolean(content);

const hasModules = (modules: unknown): boolean =>
  Array.isArray(modules) && modules.length > 0;

const hasName = (name: unknown): boolean => Boolean(name);

describe(assertCounterpartDeletable, () => {
  describe('blog_post -> page_post (content)', () => {
    const options = {
      sourceType: 'blog_post',
      counterpartType: 'page_post',
      counterpartIdParam: 'pagePostId',
      field: 'content',
      hasValue: hasContent,
    };

    it('resolves when the counterpart has content and no references remain', async () => {
      const context = createContext({
        target: { content: [{ _type: 'block' }] },
        refCount: 0,
      });

      await expect(
        assertCounterpartDeletable(
          context,
          'post-1',
          'page_post-post-1',
          options,
        ),
      ).resolves.toBeUndefined();
    });

    it('throws when the counterpart does not exist', async () => {
      const context = createContext({ target: null, refCount: 0 });

      await expect(
        assertCounterpartDeletable(
          context,
          'post-1',
          'page_post-post-1',
          options,
        ),
      ).rejects.toThrow(
        'Cannot delete blog_post "post-1": its page_post counterpart "page_post-post-1" does not exist.',
      );
    });

    it('throws when the counterpart has no content set', async () => {
      const context = createContext({ target: { content: [] }, refCount: 0 });

      await expect(
        assertCounterpartDeletable(
          context,
          'post-1',
          'page_post-post-1',
          options,
        ),
      ).rejects.toThrow(
        'Cannot delete blog_post "post-1": page_post "page_post-post-1" has no content set.',
      );
    });

    it('throws when the source is still referenced', async () => {
      const context = createContext({
        target: { content: [{ _type: 'block' }] },
        refCount: 2,
      });

      await expect(
        assertCounterpartDeletable(
          context,
          'post-1',
          'page_post-post-1',
          options,
        ),
      ).rejects.toThrow(
        'Cannot delete blog_post "post-1": still referenced by 2 document(s).',
      );
    });
  });

  describe('page_blog -> page_postIndex (modules)', () => {
    const options = {
      sourceType: 'page_blog',
      counterpartType: 'page_postIndex',
      counterpartIdParam: 'postIndexId',
      field: 'modules',
      hasValue: hasModules,
    };

    it('resolves when the counterpart has modules and no references remain', async () => {
      const context = createContext({
        target: { modules: [{ _type: 'reference', _ref: 'module-1' }] },
        refCount: 0,
      });

      await expect(
        assertCounterpartDeletable(
          context,
          'page_blog',
          'page_postIndex',
          options,
        ),
      ).resolves.toBeUndefined();
    });

    it('throws when the counterpart does not exist', async () => {
      const context = createContext({ target: null, refCount: 0 });

      await expect(
        assertCounterpartDeletable(
          context,
          'page_blog',
          'page_postIndex',
          options,
        ),
      ).rejects.toThrow(
        'Cannot delete page_blog "page_blog": its page_postIndex counterpart "page_postIndex" does not exist.',
      );
    });

    it('throws when the counterpart has no modules set', async () => {
      const context = createContext({ target: { modules: [] }, refCount: 0 });

      await expect(
        assertCounterpartDeletable(
          context,
          'page_blog',
          'page_postIndex',
          options,
        ),
      ).rejects.toThrow(
        'Cannot delete page_blog "page_blog": page_postIndex "page_postIndex" has no modules set.',
      );
    });

    it('throws when the source is still referenced', async () => {
      const context = createContext({
        target: { modules: [{ _type: 'reference', _ref: 'module-1' }] },
        refCount: 2,
      });

      await expect(
        assertCounterpartDeletable(
          context,
          'page_blog',
          'page_postIndex',
          options,
        ),
      ).rejects.toThrow(
        'Cannot delete page_blog "page_blog": still referenced by 2 document(s).',
      );
    });
  });

  describe('blog_author -> person (name)', () => {
    const options = {
      sourceType: 'blog_author',
      counterpartType: 'person',
      counterpartIdParam: 'personId',
      field: 'name',
      hasValue: hasName,
    };

    it('resolves when the counterpart has a name and no references remain', async () => {
      const context = createContext({
        target: { name: 'Jane Doe' },
        refCount: 0,
      });

      await expect(
        assertCounterpartDeletable(
          context,
          'author-1',
          'person-author-1',
          options,
        ),
      ).resolves.toBeUndefined();
    });

    it('throws when the counterpart does not exist', async () => {
      const context = createContext({ target: null, refCount: 0 });

      await expect(
        assertCounterpartDeletable(
          context,
          'author-1',
          'person-author-1',
          options,
        ),
      ).rejects.toThrow(
        'Cannot delete blog_author "author-1": its person counterpart "person-author-1" does not exist.',
      );
    });

    it('throws when the counterpart has no name set', async () => {
      const context = createContext({ target: {}, refCount: 0 });

      await expect(
        assertCounterpartDeletable(
          context,
          'author-1',
          'person-author-1',
          options,
        ),
      ).rejects.toThrow(
        'Cannot delete blog_author "author-1": person "person-author-1" has no name set.',
      );
    });

    it('throws when the source is still referenced', async () => {
      const context = createContext({
        target: { name: 'Jane Doe' },
        refCount: 2,
      });

      await expect(
        assertCounterpartDeletable(
          context,
          'author-1',
          'person-author-1',
          options,
        ),
      ).rejects.toThrow(
        'Cannot delete blog_author "author-1": still referenced by 2 document(s).',
      );
    });
  });
});
