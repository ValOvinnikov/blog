import { customRenderAsync } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import CategoryNumberedPage, {
  generateMetadata,
  generateStaticParams,
} from './page';

const { permanentRedirectMock } = vi.hoisted(() => ({
  permanentRedirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

const { getCategoryPageMock, getCategoryPaginationParamsMock } = vi.hoisted(
  () => ({
    getCategoryPageMock: vi.fn(),
    getCategoryPaginationParamsMock: vi.fn(),
  }),
);

// Isolates the redirect/404/static-params branches — none of the tested
// paths should ever reach the real service/fetch chain.
vi.mock('@blog/service', () => ({
  service: {
    pages: {
      category: {
        v1: {
          getCategoryPage: getCategoryPageMock,
          getCategoryPaginationParams: getCategoryPaginationParamsMock,
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

describe('CategoryNumberedPage generateStaticParams', () => {
  it('returns the category pagination params on success', async () => {
    getCategoryPaginationParamsMock.mockResolvedValue([
      { slug: 'engineering', page: '2' },
      { slug: 'design', page: '2' },
    ]);

    const params = await generateStaticParams();

    expect(params).toEqual([
      { slug: 'engineering', page: '2' },
      { slug: 'design', page: '2' },
    ]);
    expect(getCategoryPaginationParamsMock).toHaveBeenCalledWith(9);
  });

  it('returns an empty array when the fetch rejects', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getCategoryPaginationParamsMock.mockRejectedValue(new Error('boom'));

    const params = await generateStaticParams();

    expect(params).toEqual([]);
    errorSpy.mockRestore();
  });
});

describe('CategoryNumberedPage generateMetadata', () => {
  it('returns empty metadata for page 1', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'EN', slug: 'engineering', page: '1' }),
    });

    expect(metadata).toEqual({});
    expect(getCategoryPageMock).not.toHaveBeenCalled();
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
    getCategoryPageMock.mockResolvedValue({
      ok: true,
      data: {
        category: {
          id: 'cat-1',
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
      params: Promise.resolve({ locale: 'EN', slug: 'engineering', page: '2' }),
    });

    expect(metadata.title).toBe('Engineering – Page 2');
    expect(getCategoryPageMock).toHaveBeenCalledWith('engineering', {
      page: 2,
      itemsPerPage: 9,
    });
  });
});

const setup = customRenderAsync(CategoryNumberedPage, {
  params: Promise.resolve({
    locale: 'EN',
    slug: 'engineering',
    page: '1',
  }),
});

describe('CategoryNumberedPage', () => {
  beforeEach(() => {
    permanentRedirectMock.mockClear();
  });

  it('redirects /category/[slug]/page/1 to /category/[slug] (canonical page 1 has one URL)', async () => {
    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(permanentRedirectMock).toHaveBeenCalledWith({
      href: '/category/engineering',
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
