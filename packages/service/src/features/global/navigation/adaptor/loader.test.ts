import { makeRawNavigation } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getNavigation } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getNavigation', () => {
  it('throws when the navigation document does not exist', async () => {
    mockRun.mockResolvedValue(null);

    await expect(getNavigation(tenant)).rejects.toThrow();
  });

  it('defaults items to an empty array when none are set', async () => {
    mockRun.mockResolvedValue(makeRawNavigation({ items: null }));

    const result = await getNavigation(tenant);

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
            accessibleLabel: null,
          },
        ],
      }),
    );

    const result = await getNavigation(tenant);

    expect(result.items).toEqual([
      {
        label: 'Blog',
        href: '/blog',
        target: undefined,
        platform: undefined,
        ariaLabel: undefined,
      },
    ]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue(makeRawNavigation());

    await getNavigation(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:navigation',
            't:tenant-a:post',
            't:tenant-a:topic',
            't:tenant-a:page_generic',
            't:tenant-a:page_blog',
          ],
        }),
      }),
    );
  });
});
