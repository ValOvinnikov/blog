import { HTTP_STATUS } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { FAVICON_RESPONSE_NOT_OK_EVENT } from '@web/constants/icon';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import Icon, { contentType } from './icon';

faker.seed(6009);

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

vi.mock('@web/server/tenant/request-tenant/request-tenant');

const getSiteConfigMock = vi.mocked(getSiteConfig);

const MOCK_FAVICON_URL = faker.internet.url();
const MOCK_FAVICON_BYTES = new Uint8Array(
  faker.helpers.multiple(() => faker.number.int({ min: 0, max: 255 }), {
    count: 3,
  }),
);
const PNG_CONTENT_TYPE = 'image/png';
const CONTENT_TYPE_HEADER = 'content-type';
const SVG_MARKUP_START = '<svg';

const mockSiteConfig = (faviconAssetUrl: string | undefined) => {
  getSiteConfigMock.mockResolvedValue(
    okResult({ faviconAssetUrl }) as Awaited<ReturnType<typeof getSiteConfig>>,
  );
};

const stubFetch = (fetchMock: ReturnType<typeof vi.fn>) => {
  vi.stubGlobal('fetch', fetchMock);
};

const expectFallbackMark = async (response: Response) => {
  const markup = await response.text();

  expect(response.headers.get(CONTENT_TYPE_HEADER)).toBe(contentType);
  expect(markup).toContain(SVG_MARKUP_START);
};

describe(Icon, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('serves the uploaded favicon with its own content type', async () => {
    mockSiteConfig(MOCK_FAVICON_URL);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(MOCK_FAVICON_BYTES, {
        status: HTTP_STATUS.OK,
        headers: { 'Content-Type': PNG_CONTENT_TYPE },
      }),
    );
    stubFetch(fetchMock);

    const response = await Icon();
    const bytes = new Uint8Array(await response.arrayBuffer());
    const [requestedUrl, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];

    expect(requestedUrl).toBe(MOCK_FAVICON_URL);
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(response.headers.get(CONTENT_TYPE_HEADER)).toBe(PNG_CONTENT_TYPE);
    expect(bytes).toEqual(MOCK_FAVICON_BYTES);
  });

  it('reads the site config of the tenant resolved from the host', async () => {
    mockSiteConfig(undefined);

    await Icon();

    expect(getSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it.each([
    {
      case: 'no favicon is uploaded',
      arrange: () => {
        mockSiteConfig(undefined);
      },
    },
    {
      case: 'the tenant has no site config',
      arrange: () => {
        getSiteConfigMock.mockResolvedValue(okResult());
      },
    },
  ])('falls back to the default mark when $case', async ({ arrange }) => {
    arrange();

    const response = await Icon();

    await expectFallbackMark(response);
  });

  it('falls back to the default mark without reading site config for an unknown host', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValueOnce(undefined);

    const response = await Icon();

    await expectFallbackMark(response);
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      case: 'the site config read fails',
      arrange: () => {
        getSiteConfigMock.mockResolvedValue(
          errorResult(MOCK_ERROR) as Awaited<ReturnType<typeof getSiteConfig>>,
        );
      },
      event: 'icon.site_config_fetch_failed',
      context: { error: MOCK_ERROR },
    },
    {
      case: 'the favicon responds with a non-2xx status',
      arrange: () => {
        mockSiteConfig(MOCK_FAVICON_URL);
        stubFetch(
          vi
            .fn()
            .mockResolvedValue(
              new Response(null, { status: HTTP_STATUS.NOT_FOUND }),
            ),
        );
      },
      event: FAVICON_RESPONSE_NOT_OK_EVENT,
      context: { status: HTTP_STATUS.NOT_FOUND },
    },
    {
      case: 'the favicon fetch throws',
      arrange: () => {
        mockSiteConfig(MOCK_FAVICON_URL);
        stubFetch(vi.fn().mockRejectedValue(MOCK_ERROR));
      },
      event: 'icon.favicon_fetch_failed',
      context: { error: MOCK_ERROR },
    },
  ])(
    'falls back to the default mark and logs when $case',
    async ({ arrange, event, context }) => {
      arrange();

      const response = await Icon();

      await expectFallbackMark(response);
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(event, context);
    },
  );
});
