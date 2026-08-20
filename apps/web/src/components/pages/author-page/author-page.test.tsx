import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { makeAuthor } from '@web/testing/shared/author/fixtures';
import {
  makePostCard,
  makePostCardTopic,
} from '@web/testing/shared/post/fixtures';
import { notFound } from 'next/navigation';

import { AuthorPage } from './author-page';

const { getAuthorPageMock } = vi.hoisted(() => ({
  getAuthorPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      author: {
        v1: { getAuthorPage: getAuthorPageMock },
      },
    },
  },
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: ({
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

const author = makeAuthor({
  socialLinks: [
    { platform: 'X', url: 'https://x.com/janedoe' },
    { platform: 'GitHub', url: 'https://github.com/janedoe' },
  ],
});

const post = makePostCard({
  title: 'My Post Title',
  slug: 'my-post-slug',
  publishedAt: '2026-01-01T00:00:00.000Z',
  topic: makePostCardTopic(),
});

const setup = customRenderAsync(AuthorPage, { slug: 'jane-doe' });

describe(`<${AuthorPage.name}/>`, () => {
  beforeEach(() => {
    getAuthorPageMock.mockReset();
  });

  it('calls notFound() when the author does not exist', async () => {
    getAuthorPageMock.mockResolvedValue({ ok: true, data: null });

    await expect(setup({ slug: 'missing' })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getAuthorPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('renders the author role, name, bio, and social links', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author,
        posts: [],
        currentPage: 1,
        totalPages: 1,
        total: 0,
      },
    });

    await setup();

    expect(screen.getByText('Senior Engineer')).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Jane Doe' }),
    ).toBeVisible();
    expect(screen.getByText('Builds things.')).toBeVisible();
    expect(screen.getByRole('img', { name: 'Jane Doe' })).toHaveAttribute(
      'src',
      author.imageUrl,
    );

    const xLink = screen.getByRole('link', { name: 'X' });
    expect(xLink).toHaveAttribute('href', 'https://x.com/janedoe');
    expect(xLink.querySelector('svg')).toBeInTheDocument();
    const githubLink = screen.getByRole('link', { name: 'GitHub' });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/janedoe');
    expect(githubLink.querySelector('svg')).toBeInTheDocument();
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders no icon for a platform outside the current icon set', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author: {
          ...author,
          socialLinks: [
            { platform: 'Mastodon', url: 'https://mastodon.social/@janedoe' },
          ],
        },
        posts: [],
        currentPage: 1,
        totalPages: 1,
        total: 0,
      },
    });

    await setup();

    const mastodonLink = screen.getByRole('link', { name: 'Mastodon' });
    expect(mastodonLink.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders without a role and without social links when none are authored', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author: { ...author, role: undefined, socialLinks: [] },
        posts: [],
        currentPage: 1,
        totalPages: 1,
        total: 0,
      },
    });

    await setup();

    expect(screen.queryByText('Senior Engineer')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'X' })).not.toBeInTheDocument();
  });

  it('renders the author posts via PostsSection', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author,
        posts: [post],
        currentPage: 1,
        totalPages: 1,
        total: 1,
      },
    });

    await setup();

    const link = screen.getByRole('link', { name: 'My Post Title' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '/blog/my-post-slug');
  });

  it('renders the empty-state message when the author has no posts', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author,
        posts: [],
        currentPage: 1,
        totalPages: 1,
        total: 0,
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Posts by Jane Doe' }),
    ).toBeVisible();
    expect(
      screen.getByText("Jane Doe hasn't published any posts yet."),
    ).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'My Post Title' }),
    ).not.toBeInTheDocument();
  });

  it('calls getAuthorPage with the fixed itemsPerPage, page undefined, on page 1', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author,
        posts: [post],
        currentPage: 1,
        totalPages: 1,
        total: 1,
      },
    });

    await setup();

    expect(getAuthorPageMock).toHaveBeenCalledWith('jane-doe', {
      page: undefined,
      itemsPerPage: 9,
    });
  });

  it('calls the paginated getAuthorPage with the fixed itemsPerPage when a page is given', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author,
        posts: [post],
        currentPage: 2,
        totalPages: 3,
        total: 20,
      },
    });

    await setup({ page: 2 });

    expect(getAuthorPageMock).toHaveBeenCalledWith('jane-doe', {
      page: 2,
      itemsPerPage: 9,
    });
  });

  it('renders pagination on page 1 when there is more than one page', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author,
        posts: [post],
        currentPage: 1,
        totalPages: 3,
        total: 20,
      },
    });

    await setup();

    expect(
      screen.getByRole('navigation', { name: 'Author pages' }),
    ).toBeVisible();
  });

  it('renders pagination wired to routes.author(slug, page) when a page is given', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author,
        posts: [post],
        currentPage: 2,
        totalPages: 3,
        total: 20,
      },
    });

    await setup({ page: 2 });

    expect(
      screen.getByRole('navigation', { name: 'Author pages' }),
    ).toBeVisible();
    const nextLink = screen.getByRole('link', { name: 'Next' });
    expect(nextLink).toHaveAttribute('href', '/author/jane-doe/page/3');
    const previousLink = screen.getByRole('link', { name: 'Previous' });
    expect(previousLink).toHaveAttribute('href', '/author/jane-doe');
  });

  it('calls notFound() when the requested page is beyond totalPages', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author,
        posts: [],
        currentPage: 5,
        totalPages: 1,
        total: 1,
      },
    });

    await expect(setup({ page: 5 })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('renders the Home › Author: {name} breadcrumbs trail', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author,
        posts: [post],
        currentPage: 1,
        totalPages: 1,
        total: 1,
      },
    });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText('Author: Jane Doe');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  it('renders the breadcrumb nav as a sibling before <main>, not nested inside it', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author,
        posts: [post],
        currentPage: 1,
        totalPages: 1,
        total: 1,
      },
    });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const main = screen.getByRole('main');

    expect(main.contains(nav)).toBe(false);
    expect(
      nav.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders the JSON-LD BreadcrumbList schema script', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author,
        posts: [post],
        currentPage: 1,
        totalPages: 1,
        total: 1,
      },
    });

    const { container } = await setup();

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    const breadcrumbScript = Array.from(scripts).find((script) =>
      script.textContent?.includes('"@type":"BreadcrumbList"'),
    );
    expect(breadcrumbScript).toBeDefined();
    expect(breadcrumbScript?.textContent).toContain(
      '"item":"https://example.com/author/jane-doe"',
    );
  });
});
