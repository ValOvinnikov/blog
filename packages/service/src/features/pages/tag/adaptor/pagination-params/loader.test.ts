import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getTagPaginatedPages } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const { EN, NL } = LOCALE_ISO_CODES;
const tenant = makeTenant();

describe('getTagPaginatedPages', () => {
  it('returns the paginated pages as queried', async () => {
    const pages = [
      {
        slug: 'typescript',
        language: EN,
        moduleRefs: [{ _ref: 'list-1' }],
        postCount: 20,
      },
    ];
    mockRun.mockResolvedValueOnce(pages);

    expect(await getTagPaginatedPages(tenant, [EN, NL])).toEqual(pages);
  });

  it('passes the locales as a query parameter', async () => {
    mockRun.mockResolvedValueOnce([]);

    await getTagPaginatedPages(tenant, [EN, NL]);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { locales: [EN, NL] } }),
    );
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValueOnce([]);

    await getTagPaginatedPages(tenant, [EN, NL]);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:page_tag',
            't:tenant-a:template_tag',
            't:tenant-a:posts',
            't:tenant-a:tag',
          ],
        }),
      }),
    );
  });
});
