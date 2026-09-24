import type { MigrationContext } from 'sanity/migrate';

import { assertBlogAuthorDeletable } from './precondition';

const createContext = (result: {
  target: { name?: string } | null;
  refCount: number;
}): MigrationContext => {
  const fetch = async () => result;

  return { client: { fetch } } as unknown as MigrationContext;
};

describe(assertBlogAuthorDeletable, () => {
  it('resolves when the person counterpart has a name and no references remain', async () => {
    const context = createContext({
      target: { name: 'Jane Doe' },
      refCount: 0,
    });

    await expect(
      assertBlogAuthorDeletable(context, 'author-1', 'person-author-1'),
    ).resolves.toBeUndefined();
  });

  it('throws when the person counterpart does not exist', async () => {
    const context = createContext({ target: null, refCount: 0 });

    await expect(
      assertBlogAuthorDeletable(context, 'author-1', 'person-author-1'),
    ).rejects.toThrow(/does not exist/);
  });

  it('throws when the person counterpart has no name set', async () => {
    const context = createContext({ target: {}, refCount: 0 });

    await expect(
      assertBlogAuthorDeletable(context, 'author-1', 'person-author-1'),
    ).rejects.toThrow(/no name set/);
  });

  it('throws when the blog_author is still referenced', async () => {
    const context = createContext({
      target: { name: 'Jane Doe' },
      refCount: 2,
    });

    await expect(
      assertBlogAuthorDeletable(context, 'author-1', 'person-author-1'),
    ).rejects.toThrow(/still referenced by 2/);
  });
});
