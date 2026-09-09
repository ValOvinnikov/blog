import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import { makePostListItem } from '@web/testing/modules/post-list/fixtures';

import { PostListModuleView } from './post-list-module-view';

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

const post = makePostListItem();

const setup = customRender(PostListModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: {
    heading: 'Latest posts',
    supportingText: undefined,
  },
  items: [post],
  layout: undefined,
  contentAlignment: undefined,
  titleId: 'posts-title',
  dataTestId: 'post-list-module-post-list-1',
  accessibleTitle: 'Posts',
  emptyMessage: 'No posts yet.',
});

describe(`<${PostListModuleView.name}/>`, () => {
  it('labels the section with the given titleId', () => {
    setup();

    const label = screen.getByText('Latest posts');
    expect(label).toHaveAttribute('id', 'posts-title');
    expect(label.tagName).toBe('H2');

    const section = label.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'posts-title');
    expect(section).toHaveAttribute(
      'data-testid',
      'post-list-module-post-list-1',
    );
    expect(
      screen.getByRole('region', { name: 'Latest posts' }),
    ).toBeInTheDocument();
  });

  it('derives a different section id when given a different titleId, avoiding duplicate DOM ids', () => {
    setup({
      titleId: 'other-posts-title',
      headingBlock: {
        heading: 'More posts',
        supportingText: undefined,
      },
    });

    expect(screen.getByText('More posts')).toHaveAttribute(
      'id',
      'other-posts-title',
    );
  });

  it('renders a visually hidden heading from accessibleTitle when headingBlock.heading is undefined', () => {
    setup({
      headingBlock: {
        heading: undefined,
        supportingText: undefined,
      },
    });

    const heading = screen.getByRole('heading', { level: 2, name: 'Posts' });
    expect(heading).toHaveClass('sr-only');

    const region = screen.getByRole('region', { name: 'Posts' });
    expect(region).toHaveAttribute('aria-labelledby', 'posts-title');
  });

  it('renders a card per item, linked to its href', () => {
    setup();

    const link = screen.getByRole('link', { name: post.title });
    expect(link).toHaveAttribute('href', post.href);
    expect(
      screen.getByRole('heading', { level: 3, name: post.title }),
    ).toBeInTheDocument();
  });

  it('renders no pagination nav when the pagination prop is absent', () => {
    setup();

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders Pagination as a sibling of the grid, inside the same Section', () => {
    setup({
      pagination: {
        currentPage: 2,
        totalPages: 3,
        createHref: (page: number) => `/topics/engineering/page/${page}`,
        ariaLabel: 'Engineering pages',
        previousLabel: 'Previous',
        nextLabel: 'Next',
      },
    });

    const section = screen.getByRole('region', { name: 'Latest posts' });
    const nav = within(section).getByRole('navigation', {
      name: 'Engineering pages',
    });

    const previousLink = screen.getByRole('link', { name: 'Previous' });
    expect(previousLink).toHaveAttribute('href', '/topics/engineering/page/1');
    const nextLink = within(section).getByRole('link', { name: 'Next' });
    expect(nextLink).toHaveAttribute('href', '/topics/engineering/page/3');
    expect(nav).toBeInTheDocument();
  });

  it('renders the resolved i18n empty message instead of the grid when items is empty', () => {
    setup({ items: [] });

    expect(screen.getByText('No posts yet.')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders no media region when hasImages is not given', () => {
    setup();

    expect(screen.queryByTestId('post-card-media')).not.toBeInTheDocument();
  });

  it('renders a media region for each item when hasImages is true', () => {
    setup({
      hasImages: true,
      items: [{ ...post, image: <div data-testid="post-image" /> }],
    });

    expect(screen.getByTestId('post-card-media')).toBeInTheDocument();
    expect(screen.getByTestId('post-image')).toBeInTheDocument();
  });
});
