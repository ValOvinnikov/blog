import type { MigrationContext } from 'sanity/migrate';

import { assertBlogPostDeletable } from './precondition';

const createContext = (
  result: { target: { content?: unknown } | null; refCount: number },
): MigrationContext => {
  const fetch = async () => result;

  return { client: { fetch } } as unknown as MigrationContext;
};

describe('assertBlogPostDeletable', () => {
  it('resolves when the page_post counterpart has content and no references remain', async () => {
    const context = createContext({
      target: { content: [{ _type: 'block' }] },
      refCount: 0,
    });

    await expect(
      assertBlogPostDeletable(context, 'post-1', 'page_post-post-1'),
    ).resolves.toBeUndefined();
  });

  it('throws when the page_post counterpart does not exist', async () => {
    const context = createContext({ target: null, refCount: 0 });

    await expect(
      assertBlogPostDeletable(context, 'post-1', 'page_post-post-1'),
    ).rejects.toThrow(/does not exist/);
  });

  it('throws when the page_post counterpart has no content set', async () => {
    const context = createContext({ target: { content: [] }, refCount: 0 });

    await expect(
      assertBlogPostDeletable(context, 'post-1', 'page_post-post-1'),
    ).rejects.toThrow(/no content set/);
  });

  it('throws when the blog_post is still referenced', async () => {
    const context = createContext({
      target: { content: [{ _type: 'block' }] },
      refCount: 2,
    });

    await expect(
      assertBlogPostDeletable(context, 'post-1', 'page_post-post-1'),
    ).rejects.toThrow(/still referenced by 2/);
  });
});
