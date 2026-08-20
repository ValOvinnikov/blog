import { customRenderAsync } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import TopicNumberedPage, {
  generateMetadata,
  generateStaticParams,
} from './page';

const { permanentRedirectMock } = vi.hoisted(() => ({
  permanentRedirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

const { getTopicPageMock, getTopicPaginationParamsMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
  getTopicPaginationParamsMock: vi.fn(),
}));

// Isolates the redirect/404/static-params branches — none of the tested
// paths should ever reach the real service/fetch chain.
vi.mock('@blog/service', () => ({
  service: {
    pages: {
      topic: {
        v1: {
          getTopicPage: getTopicPageMock,
          getTopicPaginationParams: getTopicPaginationParamsMock,
        },
      },
    },
  },
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
  });

  describe('generateStaticParams', () => {
    it('returns the topic pagination params on success', async () => {
      getTopicPaginationParamsMock.mockResolvedValue({
        ok: true,
        data: [
          { slug: 'engineering', page: '2' },
          { slug: 'design', page: '2' },
        ],
      });

      const params = await generateStaticParams();

      expect(params).toEqual([
        { slug: 'engineering', page: '2' },
        { slug: 'design', page: '2' },
      ]);
      expect(getTopicPaginationParamsMock).toHaveBeenCalledWith(9);
    });

    it('returns an empty array when the fetch resolves to a failure result', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getTopicPaginationParamsMock.mockResolvedValue({
        ok: false,
        error: new Error('boom'),
      });

      const params = await generateStaticParams();

      expect(params).toEqual([]);
      errorSpy.mockRestore();
    });
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
          posts: [],
          currentPage: 2,
          totalPages: 3,
          total: 20,
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
      expect(getTopicPageMock).toHaveBeenCalledWith('engineering', {
        page: 2,
        itemsPerPage: 9,
      });
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
