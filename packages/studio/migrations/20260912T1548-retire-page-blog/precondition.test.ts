import type { MigrationContext } from 'sanity/migrate';

import { assertPageBlogDeletable } from './precondition';

const createContext = (result: {
  target: { modules?: unknown } | null;
  refCount: number;
}): MigrationContext => {
  const fetch = async () => result;

  return { client: { fetch } } as unknown as MigrationContext;
};

describe(assertPageBlogDeletable, () => {
  it('resolves when the page_postIndex counterpart has modules and no references remain', async () => {
    const context = createContext({
      target: { modules: [{ _type: 'reference', _ref: 'module-1' }] },
      refCount: 0,
    });

    await expect(
      assertPageBlogDeletable(context, 'page_blog', 'page_postIndex'),
    ).resolves.toBeUndefined();
  });

  it('throws when the page_postIndex counterpart does not exist', async () => {
    const context = createContext({ target: null, refCount: 0 });

    await expect(
      assertPageBlogDeletable(context, 'page_blog', 'page_postIndex'),
    ).rejects.toThrow(/does not exist/);
  });

  it('throws when the page_postIndex counterpart has no modules set', async () => {
    const context = createContext({ target: { modules: [] }, refCount: 0 });

    await expect(
      assertPageBlogDeletable(context, 'page_blog', 'page_postIndex'),
    ).rejects.toThrow(/no modules set/);
  });

  it('throws when the page_blog is still referenced', async () => {
    const context = createContext({
      target: { modules: [{ _type: 'reference', _ref: 'module-1' }] },
      refCount: 2,
    });

    await expect(
      assertPageBlogDeletable(context, 'page_blog', 'page_postIndex'),
    ).rejects.toThrow(/still referenced by 2/);
  });
});
