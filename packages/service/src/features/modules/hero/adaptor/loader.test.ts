import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawHeroModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import { getHero } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getHero', () => {
  it('resolves the hero using the configured featured post', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawHeroModule({
          featuredPost: makeRawPostCard({ _id: 'featured-ref' }),
        }),
      )
      .mockResolvedValueOnce(null);

    const hero = await getHero('hero-1');

    expect(hero.title).toBe('Hello World');
    expect(hero.primaryAction?.href).toBe('/blog/hello-world');
  });

  it('propagates when the hero document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getHero('missing')).rejects.toThrow();
  });

  it('tags both queries with every document type their fragments dereference', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawHeroModule())
      .mockResolvedValueOnce(null);

    await getHero('hero-1');

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({
          tags: [
            'modules:hero',
            'module:hero-1',
            'posts',
            'author',
            'topic',
            'post',
            'page_generic',
            'page_blog',
          ],
        }),
      }),
    );
    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({
          tags: ['posts', 'author', 'topic'],
        }),
      }),
    );
  });

  it('threads tenant context into both queries and scopes their tags to it', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawHeroModule())
      .mockResolvedValueOnce(null);
    const tenant = {
      projectId: 'tenant-a',
      dataset: 'production',
      token: 'tok',
    };

    await getHero('hero-1', tenant);

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:hero',
            't:tenant-a:module:hero-1',
            't:tenant-a:posts',
            't:tenant-a:author',
            't:tenant-a:topic',
            't:tenant-a:post',
            't:tenant-a:page_generic',
            't:tenant-a:page_blog',
          ],
        }),
      }),
    );
    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:posts', 't:tenant-a:author', 't:tenant-a:topic'],
        }),
      }),
    );
  });

  it('omits tenant scoping when no tenant is given (legacy behavior unchanged)', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawHeroModule())
      .mockResolvedValueOnce(null);

    await getHero('hero-1');

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({ tenant: undefined }),
    );
    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({ tenant: undefined }),
    );
  });
});
