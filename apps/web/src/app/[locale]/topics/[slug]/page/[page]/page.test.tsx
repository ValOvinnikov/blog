import { customRenderAsync } from '@web/testing/custom-render';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';

import TopicNumberedPage, { generateMetadata } from './page';

const { permanentRedirectMock } = vi.hoisted(() => ({
  permanentRedirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

const { getTopicPageMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

// Isolates the redirect/404 branches — none of the tested
// paths should ever reach the real service/fetch chain.
vi.mock('@blog/service', () => ({
  service: {
    pages: {
      topic: {
        v1: {
          getTopicPage: getTopicPageMock,
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

const setup = customRenderAsync(TopicNumberedPage, {
  params: Promise.resolve({
    locale: 'EN',
    slug: 'engineering',
    page: '1',
  }),
});

describe('TopicNumberedPage', () => {
  beforeEach(() => {
    permanentRedirectMock.mockClear();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  describe('generateMetadata', () => {
    it('returns empty metadata for page 1', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({
          locale: 'EN',
          slug: 'engineering',
          page: '1',
        }),
      });

      expect(metadata).toEqual({});
      expect(getTopicPageMock).not.toHaveBeenCalled();
    });

    it('returns empty metadata for a non-canonical page param', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({
          locale: 'EN',
          slug: 'engineering',
          page: 'abc',
        }),
      });

      expect(metadata).toEqual({});
    });

    it('builds metadata for page 2', async () => {
      getTopicPageMock.mockResolvedValue({
        ok: true,
        data: {
          topic: {
            id: 'topic-1',
            title: 'Engineering',
            slug: 'engineering',
            description: 'Posts about building things.',
          },
          modules: [],
          seo: {
            title: 'Engineering',
            description: 'Posts about building things.',
            ogTitle: 'Engineering',
            ogDescription: 'Posts about building things.',
            ogImageUrl: undefined,
          },
          postListId: 'post-list-1',
        },
      });

      const metadata = await generateMetadata({
        params: Promise.resolve({
          locale: 'EN',
          slug: 'engineering',
          page: '2',
        }),
      });

      expect(metadata.title).toBe('Engineering – Page 2');
      expect(getTopicPageMock).toHaveBeenCalledWith(
        'engineering',
        DEFAULT_TENANT_SANITY_CONTEXT,
      );
    });
  });

  it('redirects /topics/[slug]/page/1 to /topics/[slug] (canonical page 1 has one URL)', async () => {
    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(permanentRedirectMock).toHaveBeenCalledWith({
      href: '/topics/engineering',
      locale: 'EN',
    });
  });

  it.each(['abc', '02'])(
    'hard-404s a non-canonical page param (%s)',
    async (raw) => {
      await expect(
        setup({
          params: Promise.resolve({
            locale: 'EN',
            slug: 'engineering',
            page: raw,
          }),
        }),
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(vi.mocked(notFound)).toHaveBeenCalled();
    },
  );
});
