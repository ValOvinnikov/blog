import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawHeroBlogModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getHeroBlog } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getHeroBlog, () => {
  it('resolves the hero in a single round trip — exactly one runQuery call', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawHeroBlogModule({
        post: makeRawPostCard({ _id: 'pinned-post' }),
      }),
    );

    const hero = await getHeroBlog('hero-blog-1', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(hero.heading).toBe('Hello World');
    expect(hero.primaryAction?.href).toBe('/blog/hello-world');
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getHeroBlog('missing', tenant)).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawHeroBlogModule());

    await getHeroBlog('hero-blog-1', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:heroBlog',
            't:tenant-a:module:hero-blog-1',
            't:tenant-a:posts',
            't:tenant-a:author',
            't:tenant-a:topic',
            't:tenant-a:page_post',
            't:tenant-a:page_landing',
            't:tenant-a:page_blog',
          ],
        }),
      }),
    );
  });
});
