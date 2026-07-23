import { customRenderAsync } from '@web/testing/custom-render';

import TagNumberedPage, {
  generateMetadata,
  generateStaticParams,
} from './page';

const { permanentRedirectMock } = vi.hoisted(() => ({
  permanentRedirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

const { getTagPageMock, getTagPaginationParamsMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
  getTagPaginationParamsMock: vi.fn(),
}));

// Isolates the redirect/404/static-params branches — none of the tested
// paths should ever reach the real service/fetch chain.
vi.mock('@blog/service', () => ({
  service: {
    pages: {
      tag: {
        v1: {
          getTagPage: getTagPageMock,
          getTagPaginationParams: getTagPaginationParamsMock,
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

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
}));

describe('TagNumberedPage generateStaticParams', () => {
  it('returns the tag pagination params on success', async () => {
    getTagPaginationParamsMock.mockResolvedValue([
      { slug: 'typescript', page: '2' },
      { slug: 'react', page: '2' },
    ]);

    const params = await generateStaticParams();

    expect(params).toEqual([
      { slug: 'typescript', page: '2' },
      { slug: 'react', page: '2' },
    ]);
    expect(getTagPaginationParamsMock).toHaveBeenCalledWith(9);
  });

  it('returns an empty array when the fetch rejects', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagPaginationParamsMock.mockRejectedValue(new Error('boom'));

    const params = await generateStaticParams();

    expect(params).toEqual([]);
    errorSpy.mockRestore();
  });
});

describe('TagNumberedPage generateMetadata', () => {
  it('returns empty metadata for page 1', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'EN', slug: 'typescript', page: '1' }),
    });

    expect(metadata).toEqual({});
    expect(getTagPageMock).not.toHaveBeenCalled();
  });

  it('returns empty metadata for a non-canonical page param', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({
        locale: 'EN',
        slug: 'typescript',
        page: 'abc',
      }),
    });

    expect(metadata).toEqual({});
  });

  it('builds metadata for page 2', async () => {
    getTagPageMock.mockResolvedValue({
      tag: {
        id: 'tag-1',
        title: 'TypeScript',
        slug: 'typescript',
        description: 'Posts about TypeScript.',
        seo: {
          title: 'TypeScript',
          description: 'Posts about TypeScript.',
          ogTitle: 'TypeScript',
          ogDescription: 'Posts about TypeScript.',
          ogImageUrl: undefined,
        },
      },
      posts: [],
      currentPage: 2,
      totalPages: 3,
      total: 20,
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'EN', slug: 'typescript', page: '2' }),
    });

    expect(metadata.title).toBe('TypeScript – Page 2');
    expect(getTagPageMock).toHaveBeenCalledWith('typescript', {
      page: 2,
      itemsPerPage: 9,
    });
  });
});

const setup = customRenderAsync(TagNumberedPage, {
  params: Promise.resolve({
    locale: 'EN',
    slug: 'typescript',
    page: '1',
  }),
});

describe('TagNumberedPage', () => {
  beforeEach(() => {
    permanentRedirectMock.mockClear();
    notFoundMock.mockClear();
  });

  it('redirects /tag/[slug]/page/1 to /tag/[slug] (canonical page 1 has one URL)', async () => {
    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(permanentRedirectMock).toHaveBeenCalledWith({
      href: '/tag/typescript',
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
            slug: 'typescript',
            page: raw,
          }),
        }),
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(notFoundMock).toHaveBeenCalled();
    },
  );
});
