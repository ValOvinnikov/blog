import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  makePostCard,
  makePostCardCategory,
} from '@web/testing/shared/post/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { makeTag } from '@web/testing/shared/tag/fixtures';
import { notFound } from 'next/navigation';

import { TagPage } from './tag-page';

const { getTagPageMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      tag: { v1: { getTagPage: getTagPageMock } },
    },
  },
}));

vi.mock('@web/i18n/navigation', () => ({
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

const tag = makeTag({
  description: 'The latest TypeScript posts.',
  seo: makeSeo({
    title: 'TypeScript',
    description: 'The latest TypeScript posts.',
    ogTitle: 'TypeScript',
    ogDescription: 'The latest TypeScript posts.',
  }),
});

const post = makePostCard({
  title: 'My Post Title',
  slug: 'my-post-slug',
  publishedAt: '2026-01-01T00:00:00.000Z',
  categories: [makePostCardCategory()],
});

const setup = customRenderAsync(TagPage, {
  slug: 'typescript',
  locale: 'en',
});

describe('TagPage', () => {
  beforeEach(() => {
    getTagPageMock.mockReset();
  });

  it('calls notFound() when the tag does not exist', async () => {
    getTagPageMock.mockResolvedValue({ ok: true, data: null });

    await expect(setup({ slug: 'missing' })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getTagPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('renders the tag heading, description, and posts', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        posts: [post],
        currentPage: 1,
        totalPages: 1,
        total: 1,
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'TypeScript' }),
    ).toBeVisible();
    expect(screen.getByText('The latest TypeScript posts.')).toBeVisible();

    const link = screen.getByRole('link', { name: 'My Post Title' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '/blog/my-post-slug');
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the empty-state message when the tag has no posts', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        posts: [],
        currentPage: 1,
        totalPages: 1,
        total: 0,
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'TypeScript' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Posts tagged TypeScript',
      }),
    ).toBeVisible();
    expect(screen.getByText('No posts tagged TypeScript yet.')).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('calls getTagPage with the fixed itemsPerPage, page undefined, on page 1', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        posts: [post],
        currentPage: 1,
        totalPages: 1,
        total: 1,
      },
    });

    await setup();

    expect(getTagPageMock).toHaveBeenCalledWith('typescript', {
      page: undefined,
      itemsPerPage: 9,
    });
  });

  it('calls the paginated getTagPage with the fixed itemsPerPage when a page is given', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        posts: [post],
        currentPage: 2,
        totalPages: 3,
        total: 20,
      },
    });

    await setup({ page: 2 });

    expect(getTagPageMock).toHaveBeenCalledWith('typescript', {
      page: 2,
      itemsPerPage: 9,
    });
  });

  it('renders pagination on page 1 when there is more than one page', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        posts: [post],
        currentPage: 1,
        totalPages: 3,
        total: 20,
      },
    });

    await setup();

    expect(screen.getByRole('navigation', { name: 'Tag pages' })).toBeVisible();
  });

  it('renders pagination wired to routes.tag(slug, page) when a page is given', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        posts: [post],
        currentPage: 2,
        totalPages: 3,
        total: 20,
      },
    });

    await setup({ page: 2 });

    expect(screen.getByRole('navigation', { name: 'Tag pages' })).toBeVisible();
    const nextLink = screen.getByRole('link', { name: 'Next' });
    expect(nextLink).toHaveAttribute('href', '/tag/typescript/page/3');
  });

  it('calls notFound() when the requested page is beyond totalPages', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: {
        tag,
        posts: [],
        currentPage: 5,
        totalPages: 1,
        total: 1,
      },
    });

    await expect(setup({ page: 5 })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });
});
