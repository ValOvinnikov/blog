import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';
import { customRenderAsync } from '@web/testing/custom-render';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';

import TagNumberedPage, { generateMetadata, revalidate } from './page';

const { permanentRedirectMock } = vi.hoisted(() => ({
  permanentRedirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

const { getTagPageMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

// Isolates the redirect/404 branches — none of the tested
// paths should ever reach the real service/fetch chain.
vi.mock('@blog/service', () => ({
  service: {
    pages: {
      tag: {
        v1: {
          getTagPage: getTagPageMock,
        },
      },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@web/i18n/navigation', () => ({
  permanentRedirect: permanentRedirectMock,
}));

const setup = customRenderAsync(TagNumberedPage, {
  params: Promise.resolve({
    tenant: 'tenant-1',
    locale: 'EN',
    slug: 'typescript',
    page: '1',
  }),
});

describe('TagNumberedPage', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  beforeEach(() => {
    permanentRedirectMock.mockClear();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  describe('generateMetadata', () => {
    it('returns empty metadata for page 1', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: 'EN',
          slug: 'typescript',
          page: '1',
        }),
      });

      expect(metadata).toEqual({});
      expect(getTagPageMock).not.toHaveBeenCalled();
    });

    it('returns empty metadata for a non-canonical page param', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: 'EN',
          slug: 'typescript',
          page: 'abc',
        }),
      });

      expect(metadata).toEqual({});
    });

    it('builds metadata for page 2', async () => {
      getTagPageMock.mockResolvedValue({
        ok: true,
        data: {
          tag: {
            id: 'tag-1',
            title: 'TypeScript',
            slug: 'typescript',
            description: 'Posts about TypeScript.',
          },
          modules: [],
          seo: {
            title: 'TypeScript',
            description: 'Posts about TypeScript.',
            ogTitle: 'TypeScript',
            ogDescription: 'Posts about TypeScript.',
            ogImageUrl: undefined,
          },
          postListId: 'post-list-1',
        },
      });

      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: 'EN',
          slug: 'typescript',
          page: '2',
        }),
      });

      expect(metadata.title).toBe('TypeScript – Page 2');
      expect(getTagPageMock).toHaveBeenCalledWith(
        'typescript',
        DEFAULT_TENANT_SANITY_CONTEXT,
      );
    });
  });

  it('redirects /tags/[slug]/page/1 to /tags/[slug] (canonical page 1 has one URL)', async () => {
    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(permanentRedirectMock).toHaveBeenCalledWith({
      href: '/tags/typescript',
      locale: 'EN',
    });
  });

  it.each(['abc', '02'])(
    'hard-404s a non-canonical page param (%s)',
    async (raw) => {
      await expect(
        setup({
          params: Promise.resolve({
            tenant: 'tenant-1',
            locale: 'EN',
            slug: 'typescript',
            page: raw,
          }),
        }),
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(vi.mocked(notFound)).toHaveBeenCalled();
    },
  );
});
