import { makeRawNavigation } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';

import { getNavigation } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getNavigation', () => {
  it('throws when the navigation document does not exist', async () => {
    mockRun.mockResolvedValue(null);

    await expect(getNavigation()).rejects.toThrow();
  });

  it('defaults items to an empty array when none are set', async () => {
    mockRun.mockResolvedValue(makeRawNavigation({ items: null }));

    const result = await getNavigation();

    expect(result.items).toEqual([]);
  });

  it('maps raw navigation items into a domain object', async () => {
    mockRun.mockResolvedValue(
      makeRawNavigation({
        items: [
          {
            label: 'Blog',
            linkType: 'EXTERNAL',
            url: '/blog',
            internalReference: null,
            openInNewTab: null,
            platform: null,
          },
        ],
      }),
    );

    const result = await getNavigation();

    expect(result.items).toEqual([
      { label: 'Blog', href: '/blog', target: undefined, platform: undefined },
    ]);
  });

  it('tags the query with every type its items can reference internally', async () => {
    mockRun.mockResolvedValue(makeRawNavigation());

    await getNavigation();

    expect(mockRun).toHaveBeenCalledWith(expect.anything(), {
      next: {
        revalidate: 3600,
        tags: ['navigation', 'post', 'category', 'page_generic', 'page_blog'],
      },
    });
  });
});
