import { customRenderAsync, screen } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import { AuthorPage } from './author-page';

const { getAuthorPageMock } = vi.hoisted(() => ({
  getAuthorPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      author: {
        v1: { getAuthorPage: getAuthorPageMock },
      },
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

const author = {
  id: 'author-1',
  name: 'Jane Doe',
  slug: 'jane-doe',
  role: 'Senior Engineer',
  imageUrl: 'https://cdn.example.com/jane.jpg',
  bio: [
    {
      _type: 'block' as const,
      _key: 'b1',
      children: [
        { _type: 'span' as const, _key: 's1', text: 'Builds things.' },
      ],
    },
  ],
  socialLinks: [
    { platform: 'X', url: 'https://x.com/janedoe' },
    { platform: 'GitHub', url: 'https://github.com/janedoe' },
  ],
};

const post = {
  id: 'post-1',
  title: 'My Post Title',
  slug: 'my-post-slug',
  excerpt: 'An excerpt.',
  publishedAt: '2026-01-01T00:00:00.000Z',
  categories: [{ id: 'cat-1', title: 'News', slug: 'news' }],
};

const setup = customRenderAsync(AuthorPage, { slug: 'jane-doe', locale: 'en' });

describe('AuthorPage', () => {
  beforeEach(() => {
    getAuthorPageMock.mockReset();
  });

  it('calls notFound() when the author does not exist', async () => {
    getAuthorPageMock.mockResolvedValue(null);

    await expect(setup({ slug: 'missing' })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('renders the author role, name, bio, and social links', async () => {
    getAuthorPageMock.mockResolvedValue({ author, posts: [] });

    await setup();

    expect(screen.getByText('Senior Engineer')).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Jane Doe' }),
    ).toBeVisible();
    expect(screen.getByText('Builds things.')).toBeVisible();
    expect(screen.getByRole('img', { name: 'Jane Doe' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/jane.jpg',
    );

    const xLink = screen.getByRole('link', { name: 'X' });
    expect(xLink).toHaveAttribute('href', 'https://x.com/janedoe');
    const githubLink = screen.getByRole('link', { name: 'GitHub' });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/janedoe');
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders without a role and without social links when none are authored', async () => {
    getAuthorPageMock.mockResolvedValue({
      author: { ...author, role: undefined, socialLinks: [] },
      posts: [],
    });

    await setup();

    expect(screen.queryByText('Senior Engineer')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the author posts via PostsSection', async () => {
    getAuthorPageMock.mockResolvedValue({ author, posts: [post] });

    await setup();

    const link = screen.getByRole('link', { name: 'My Post Title' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '/blog/my-post-slug');
  });

  it('renders no posts section when the author has no posts', async () => {
    getAuthorPageMock.mockResolvedValue({ author, posts: [] });

    await setup();

    expect(
      screen.queryByRole('link', { name: 'My Post Title' }),
    ).not.toBeInTheDocument();
  });
});
