/**
 * @vitest-environment jsdom
 */
import {
  HTTP_STATUS,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import type { TFeedPost } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { getRssSelfLink } from '@web/testing/shared/rss/get-rss-self-link';
import { makeTagDetailPage } from '@web/testing/shared/tag/fixtures';
import { DEFAULT_TENANT_BASE_URL } from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';

const {
  getTagPageMock,
  getPublishedPostsByTagMock,
  getHostTenantSanityContextMock,
} = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
  getPublishedPostsByTagMock: vi.fn(),
  getHostTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: { tag: { v1: { getTagPage: getTagPageMock } } },
    entities: {
      posts: {
        v1: { getPublishedPostsByTag: getPublishedPostsByTagMock },
      },
    },
  },
}));

vi.mock(
  '@web/server/tenant/tenant-sanity-context/tenant-sanity-context',
  () => ({
    getHostTenantSanityContext: getHostTenantSanityContextMock,
  }),
);

vi.mock('@web/server/tenant/tenant-base-url/tenant-base-url');

const getTenantBaseUrlMock = vi.mocked(getTenantBaseUrl);

const POST_TITLE = 'Hello & Welcome';

const post: TFeedPost = {
  title: POST_TITLE,
  slug: 'hello-welcome',
  excerpt: 'A <first> post.',
  publishedAt: '2026-01-15T00:00:00Z',
};

const { EN, NL } = LOCALE_ISO_CODES;

const tenant = {
  projectId: 'tenant-project',
  dataset: 'production',
  token: 'tenant-token',
  defaultLocale: EN,
};

const paramsFor = (locale: string = EN) =>
  Promise.resolve({ tenant: 'tenant-1', locale, slug: 'typescript' });

const params = paramsFor();

const TAG_DESCRIPTION = 'The latest TypeScript posts.';
const XML_MIME_TYPE = 'application/xml';
const CHANNEL_DESCRIPTION = 'channel > description';
const ITEM_LINK = 'item > link';

describe('GET /[locale]/tags/[slug]/rss.xml', () => {
  let GET: typeof import('./route').GET;
  let logger: typeof import('@web/utils/logger/logger').logger;

  beforeEach(async () => {
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant,
    });
    getTenantBaseUrlMock.mockResolvedValue(DEFAULT_TENANT_BASE_URL);
    getTagPageMock.mockResolvedValue(
      okResult(
        makeTagDetailPage({
          tag: {
            id: 'tag-1',
            title: 'TypeScript',
            slug: 'typescript',
            description: undefined,
          },
        }),
      ),
    );
    getPublishedPostsByTagMock.mockResolvedValue(okResult([post]));
    ({ GET } = await import('./route'));
    ({ logger } = await import('@web/utils/logger/logger'));
  });

  afterEach(() => {
    vi.resetModules();
    getTagPageMock.mockReset();
    getPublishedPostsByTagMock.mockReset();
    getHostTenantSanityContextMock.mockReset();
    getTenantBaseUrlMock.mockReset();
  });

  it('returns a valid RSS 2.0 feed scoped to the tag with the correct content type', async () => {
    getTagPageMock.mockResolvedValue(
      okResult(
        makeTagDetailPage({
          tag: {
            id: 'tag-1',
            title: 'TypeScript',
            slug: 'typescript',
            description: TAG_DESCRIPTION,
          },
        }),
      ),
    );
    const response = await GET(new Request(DEFAULT_TENANT_BASE_URL), {
      params,
    });
    const xml = await response.text();

    expect(response.headers.get('Content-Type')).toBe(
      'application/rss+xml; charset=utf-8',
    );

    const doc = new DOMParser().parseFromString(xml, XML_MIME_TYPE);
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.querySelector('channel > title')?.textContent).toBe(
      'TypeScript',
    );
    expect(doc.querySelector(CHANNEL_DESCRIPTION)?.textContent).toBe(
      TAG_DESCRIPTION,
    );
    expect(doc.querySelector('item > title')?.textContent).toBe(POST_TITLE);
    expect(doc.querySelector(ITEM_LINK)?.textContent).toBe(
      `${DEFAULT_TENANT_BASE_URL}/blog/hello-welcome`,
    );
    expect(getTagPageMock).toHaveBeenCalledWith('typescript', {
      ...tenant,
      locale: EN,
    });
  });

  it('falls back to the tag title as the channel description when none is authored', async () => {
    getPublishedPostsByTagMock.mockResolvedValue(okResult([]));
    const response = await GET(new Request(DEFAULT_TENANT_BASE_URL), {
      params,
    });
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, XML_MIME_TYPE);

    expect(doc.querySelector(CHANNEL_DESCRIPTION)?.textContent).toBe(
      'TypeScript',
    );
  });

  it('calls notFound() when the tag fetch fails', async () => {
    getTagPageMock.mockResolvedValue(errorResult(new Error('boom')));
    await expect(
      GET(new Request(DEFAULT_TENANT_BASE_URL), { params }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(getPublishedPostsByTagMock).not.toHaveBeenCalled();
  });

  it('calls notFound() without logging when the tag simply does not exist', async () => {
    getTagPageMock.mockResolvedValue(okResult());
    await expect(
      GET(new Request(DEFAULT_TENANT_BASE_URL), { params }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(getPublishedPostsByTagMock).not.toHaveBeenCalled();
    expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
  });

  it('calls notFound() when the posts fetch fails', async () => {
    getTagPageMock.mockResolvedValue(okResult(makeTagDetailPage()));
    getPublishedPostsByTagMock.mockResolvedValue(
      errorResult(new Error('boom')),
    );
    await expect(
      GET(new Request(DEFAULT_TENANT_BASE_URL), { params }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('resolves the tag and its posts in the feed language and links posts in it', async () => {
    const response = await GET(new Request(DEFAULT_TENANT_BASE_URL), {
      params: paramsFor(NL),
    });
    const doc = new DOMParser().parseFromString(
      await response.text(),
      XML_MIME_TYPE,
    );

    const localizedTenant = { ...tenant, locale: NL };
    expect(getTagPageMock).toHaveBeenCalledWith('typescript', localizedTenant);
    expect(getPublishedPostsByTagMock).toHaveBeenCalledWith(
      'tag-1',
      localizedTenant,
    );
    expect(doc.querySelector(ITEM_LINK)?.textContent).toBe(
      'https://example.com/nl/blog/hello-welcome',
    );
  });

  it('carries the language, home link and self link of the feed', async () => {
    const response = await GET(new Request(DEFAULT_TENANT_BASE_URL), {
      params: paramsFor(NL),
    });
    const doc = new DOMParser().parseFromString(
      await response.text(),
      XML_MIME_TYPE,
    );

    expect(doc.querySelector('channel > language')?.textContent).toBe('nl');
    expect(doc.querySelector('channel > link')?.textContent).toBe(
      'https://example.com/nl',
    );
    expect(getRssSelfLink(doc)?.getAttribute('href')).toBe(
      'https://example.com/nl/tags/typescript/rss.xml',
    );
  });

  it('returns a 404 for a language the site does not support', async () => {
    const response = await GET(new Request(DEFAULT_TENANT_BASE_URL), {
      params: paramsFor('xx'),
    });

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(getTagPageMock).not.toHaveBeenCalled();
  });

  it('returns a 404 without querying any content when the host is unresolvable', async () => {
    getHostTenantSanityContextMock.mockResolvedValue({ isResolvable: false });
    const response = await GET(new Request(DEFAULT_TENANT_BASE_URL), {
      params,
    });

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(getTagPageMock).not.toHaveBeenCalled();
  });
});
