import { customRenderAsync, screen } from '@web/testing/custom-render';

import { PostListModule } from './post-list-module';

const { getPostListMock } = vi.hoisted(() => ({
  getPostListMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      postList: { v1: { getPostList: getPostListMock } },
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

const post = {
  id: 'post-1',
  title: 'First post',
  slug: 'first-post',
  excerpt: 'An excerpt',
  publishedAt: '2026-01-01T00:00:00.000Z',
  heroImageUrl: undefined,
  heroImageAlt: undefined,
  heroImageSanity: undefined,
  featured: false,
  author: {
    id: 'author-1',
    name: 'Jane Doe',
    slug: 'jane-doe',
    imageUrl: undefined,
  },
  categories: [],
};

const setup = customRenderAsync(PostListModule, {
  id: 'post-list-1',
  locale: 'en',
});

describe(PostListModule, () => {
  beforeEach(() => {
    getPostListMock.mockReset();
  });

  it('renders nothing when the fetch fails', async () => {
    getPostListMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('labels the section with a unique id derived from the module id', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: { title: 'Latest posts', posts: [post] },
    });

    const { container } = await setup();

    const label = screen.getByText('Latest posts');
    expect(label).toHaveAttribute('id', 'latest-posts-post-list-1');

    const section = container.querySelector('section');
    expect(section).toHaveAttribute(
      'aria-labelledby',
      'latest-posts-post-list-1',
    );
  });

  it('derives a different section id for a different module id, avoiding duplicate DOM ids', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: { title: 'More posts', posts: [post] },
    });

    await setup({ id: 'post-list-2' });

    expect(screen.getByText('More posts')).toHaveAttribute(
      'id',
      'latest-posts-post-list-2',
    );
  });
});
