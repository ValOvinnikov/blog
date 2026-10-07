import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPostParams } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const { EN, NL } = LOCALE_ISO_CODES;
const tenant = makeTenant();

describe('getPostParams', () => {
  beforeEach(() => {
    mockRun.mockResolvedValue([]);
  });

  it('returns the slug, language and publishedAt entries', async () => {
    mockRun.mockResolvedValue([
      { slug: 'post-a', language: EN, publishedAt: '2026-01-01T00:00:00Z' },
      { slug: 'artikel-a', language: NL, publishedAt: '2026-02-01T00:00:00Z' },
    ]);

    const params = await getPostParams(tenant, [EN, NL]);

    expect(params).toEqual([
      { slug: 'post-a', language: EN, publishedAt: '2026-01-01T00:00:00Z' },
      { slug: 'artikel-a', language: NL, publishedAt: '2026-02-01T00:00:00Z' },
    ]);
  });

  it('returns an empty array when there are no posts', async () => {
    const params = await getPostParams(tenant, [EN]);

    expect(params).toEqual([]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    await getPostParams(tenant, [EN]);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:page_post'] }),
      }),
    );
  });

  it('passes the live languages to the query', async () => {
    await getPostParams(tenant, [EN, NL]);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { locales: [EN, NL] } }),
    );
  });
});
