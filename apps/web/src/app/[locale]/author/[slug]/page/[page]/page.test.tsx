import { customRenderAsync } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import AuthorNumberedPage, {
  generateMetadata,
  generateStaticParams,
} from './page';

const { permanentRedirectMock } = vi.hoisted(() => ({
  permanentRedirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

const { getAuthorPageMock, getAuthorPaginationParamsMock } = vi.hoisted(() => ({
  getAuthorPageMock: vi.fn(),
  getAuthorPaginationParamsMock: vi.fn(),
}));

// Isolates the redirect/404/static-params branches — none of the tested
// paths should ever reach the real service/fetch chain.
vi.mock('@blog/service', () => ({
  service: {
    entities: {
      author: {
        v1: {
          getAuthorPage: getAuthorPageMock,
          getAuthorPaginationParams: getAuthorPaginationParamsMock,
        },
      },
    },
  },
}));

vi.mock('@web/i18n/navigation', () => ({
  permanentRedirect: permanentRedirectMock,
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('AuthorNumberedPage generateStaticParams', () => {
  it('returns the author pagination params on success', async () => {
    getAuthorPaginationParamsMock.mockResolvedValue([
      { slug: 'jane-doe', page: '2' },
      { slug: 'john-smith', page: '2' },
    ]);

    const params = await generateStaticParams();

    expect(params).toEqual([
      { slug: 'jane-doe', page: '2' },
      { slug: 'john-smith', page: '2' },
    ]);
    expect(getAuthorPaginationParamsMock).toHaveBeenCalledWith(9);
  });

  it('returns an empty array when the fetch rejects', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getAuthorPaginationParamsMock.mockRejectedValue(new Error('boom'));

    const params = await generateStaticParams();

    expect(params).toEqual([]);
    errorSpy.mockRestore();
  });
});

describe('AuthorNumberedPage generateMetadata', () => {
  it('returns empty metadata for page 1', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'EN', slug: 'jane-doe', page: '1' }),
    });

    expect(metadata).toEqual({});
    expect(getAuthorPageMock).not.toHaveBeenCalled();
  });

  it('returns empty metadata for a non-canonical page param', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({
        locale: 'EN',
        slug: 'jane-doe',
        page: 'abc',
      }),
    });

    expect(metadata).toEqual({});
  });

  it('builds metadata for page 2', async () => {
    getAuthorPageMock.mockResolvedValue({
      author: {
        id: 'author-1',
        name: 'Jane Doe',
        slug: 'jane-doe',
        role: 'Senior Engineer',
        imageUrl: undefined,
        bio: undefined,
        socialLinks: [],
      },
      posts: [],
      currentPage: 2,
      totalPages: 3,
      total: 20,
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'EN', slug: 'jane-doe', page: '2' }),
    });

    expect(metadata.title).toBe('Jane Doe — Senior Engineer – Page 2');
    expect(getAuthorPageMock).toHaveBeenCalledWith('jane-doe', {
      page: 2,
      itemsPerPage: 9,
    });
  });
});

const setup = customRenderAsync(AuthorNumberedPage, {
  params: Promise.resolve({
    locale: 'EN',
    slug: 'jane-doe',
    page: '1',
  }),
});

describe('AuthorNumberedPage', () => {
  beforeEach(() => {
    permanentRedirectMock.mockClear();
  });

  it('redirects /author/[slug]/page/1 to /author/[slug] (canonical page 1 has one URL)', async () => {
    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(permanentRedirectMock).toHaveBeenCalledWith({
      href: '/author/jane-doe',
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
            slug: 'jane-doe',
            page: raw,
          }),
        }),
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(vi.mocked(notFound)).toHaveBeenCalled();
    },
  );
});
