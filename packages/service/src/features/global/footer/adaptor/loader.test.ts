import { makeRawFooter } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';

import { getFooter } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getFooter', () => {
  it('throws when the footer document does not exist', async () => {
    mockRun.mockResolvedValue(null);

    await expect(getFooter()).rejects.toThrow();
  });

  it('defaults social to an empty array when none are set', async () => {
    mockRun.mockResolvedValue(makeRawFooter({ social: null }));

    const result = await getFooter();

    expect(result.social).toEqual([]);
  });

  it('maps raw social links into a domain object', async () => {
    mockRun.mockResolvedValue(
      makeRawFooter({
        social: [
          {
            label: 'GitHub',
            linkType: 'EXTERNAL',
            url: 'https://github.com/val',
            internalReference: null,
            openInNewTab: null,
            platform: 'GITHUB',
            accessibleLabel: null,
          },
        ],
      }),
    );

    const result = await getFooter();

    expect(result.social).toEqual([
      {
        label: 'GitHub',
        href: 'https://github.com/val',
        target: undefined,
        platform: 'GITHUB',
        ariaLabel: undefined,
      },
    ]);
  });

  it('tags the query with every type its social links can reference internally', async () => {
    mockRun.mockResolvedValue(makeRawFooter());

    await getFooter();

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({
          tags: ['footer', 'post', 'topic', 'page_generic', 'page_blog'],
        }),
      }),
    );
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue(makeRawFooter());
    const tenant = {
      projectId: 'tenant-a',
      dataset: 'production',
      token: 'tok',
    };

    await getFooter(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:footer',
            't:tenant-a:post',
            't:tenant-a:topic',
            't:tenant-a:page_generic',
            't:tenant-a:page_blog',
          ],
        }),
      }),
    );
  });

  it('omits tenant scoping when no tenant is given (legacy behavior unchanged)', async () => {
    mockRun.mockResolvedValue(makeRawFooter());

    await getFooter();

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tenant: undefined }),
    );
  });
});
