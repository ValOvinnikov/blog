import { HTTP_STATUS } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { toInitial } from '@blog/utils/primitives';
import { faker } from '@faker-js/faker';
import { ICON_LOG } from '@web/constants/icon';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@web/testing/shared/tenant/fixtures';
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
const MOCK_BRAND_NAME = faker.company.name();
const MOCK_LOGO_HUE = faker.number.int({ min: 0, max: 179 });
const MOCK_OTHER_LOGO_HUE = MOCK_LOGO_HUE + 180;
const PNG_CONTENT_TYPE = 'image/png';
const CONTENT_TYPE_HEADER = 'content-type';
const SVG_MARKUP_START = '<svg';
const RETIRED_MARK_ELEMENT = '<polygon';

const arrangeSiteConfig = (
  overrides: Parameters<typeof mockSiteConfig>[0] = {},
) => {
  getSiteConfigMock.mockResolvedValue(okResult(mockSiteConfig(overrides)));
};

const letterOf = (markup: string) =>
  markup.match(/<text[^>]*>([^<]*)<\/text>/)?.[1];

const readSvg = async (response: Response) => {
  expect(response.headers.get(CONTENT_TYPE_HEADER)).toBe(contentType);
  const markup = await response.text();
  expect(markup).toContain(SVG_MARKUP_START);
  expect(markup).not.toContain(RETIRED_MARK_ELEMENT);
  return markup;
};

const stubFetch = (fetchMock: ReturnType<typeof vi.fn>) => {
  vi.stubGlobal('fetch', fetchMock);
};

const expectNeutralTile = async (response: Response) => {
  const markup = await readSvg(response);

  expect(letterOf(markup)).toBeUndefined();
};

describe(Icon, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('serves the uploaded favicon with its own content type', async () => {
    arrangeSiteConfig({ faviconAssetUrl: MOCK_FAVICON_URL });
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
    arrangeSiteConfig();

    await Icon();

    expect(getSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it("draws the brand name's initial when no favicon is uploaded", async () => {
    arrangeSiteConfig({ brandName: MOCK_BRAND_NAME });

    const markup = await readSvg(await Icon());

    expect(letterOf(markup)).toBe(toInitial(MOCK_BRAND_NAME));
  });

  it.each([
    {
      case: 'no brand name is set',
      arrange: () => {
        arrangeSiteConfig();
      },
    },
    {
      case: 'the tenant has no site config',
      arrange: () => {
        getSiteConfigMock.mockResolvedValue(okResult());
      },
    },
  ])("draws the tenant name's initial when $case", async ({ arrange }) => {
    arrange();

    const markup = await readSvg(await Icon());

    expect(letterOf(markup)).toBe(toInitial(MOCK_TENANT_NAME));
  });

  it("colours the initial tile by the site's logo hue", async () => {
    arrangeSiteConfig({ logoHue: MOCK_LOGO_HUE });
    const markup = await readSvg(await Icon());
    arrangeSiteConfig({ logoHue: MOCK_OTHER_LOGO_HUE });

    const otherMarkup = await readSvg(await Icon());

    expect(otherMarkup).not.toBe(markup);
  });

  it('answers a neutral tile without reading site config for an unknown host', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValueOnce(undefined);

    const response = await Icon();

    await expectNeutralTile(response);
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
      event: ICON_LOG.SITE_CONFIG_FETCH_FAILED,
      context: { error: MOCK_ERROR },
    },
    {
      case: 'the favicon responds with a non-2xx status',
      arrange: () => {
        arrangeSiteConfig({ faviconAssetUrl: MOCK_FAVICON_URL });
        stubFetch(
          vi
            .fn()
            .mockResolvedValue(
              new Response(null, { status: HTTP_STATUS.NOT_FOUND }),
            ),
        );
      },
      event: ICON_LOG.FAVICON_RESPONSE_NOT_OK,
      context: { status: HTTP_STATUS.NOT_FOUND },
    },
    {
      case: 'the favicon fetch throws',
      arrange: () => {
        arrangeSiteConfig({ faviconAssetUrl: MOCK_FAVICON_URL });
        stubFetch(vi.fn().mockRejectedValue(MOCK_ERROR));
      },
      event: ICON_LOG.FAVICON_FETCH_FAILED,
      context: { error: MOCK_ERROR },
    },
  ])(
    'answers a neutral tile and logs when $case',
    async ({ arrange, event, context }) => {
      arrange();

      const response = await Icon();

      await expectNeutralTile(response);
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(event, context);
    },
  );
});
