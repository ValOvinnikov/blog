import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
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
  sectionHeader: {
    heading: 'Latest posts',
    supportingText: undefined,
    align: undefined,
  },
  items: [post],
  layout: undefined,
  titleId: 'posts-title',
  dataTestId: 'post-list-module-post-list-1',
  accessibleTitle: 'Posts',
  emptyMessage: 'No posts yet.',
});

describe(PostListModuleView, () => {
  it('labels the section with the given titleId', () => {
    setup();

    const label = screen.getByText('Latest posts');
    expect(label).toHaveAttribute('id', 'posts-title');

    const section = label.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'posts-title');
    expect(section).not.toHaveAttribute('aria-label');
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
      sectionHeader: {
        heading: 'More posts',
        supportingText: undefined,
        align: undefined,
      },
    });

    expect(screen.getByText('More posts')).toHaveAttribute(
      'id',
      'other-posts-title',
    );
  });

  it('renders a visually hidden heading from accessibleTitle and labels the section via aria-labelledby when sectionHeader.heading is undefined', () => {
    setup({
      sectionHeader: {
        heading: undefined,
        supportingText: undefined,
        align: undefined,
      },
    });

    const heading = screen.getByRole('heading', { level: 2, name: 'Posts' });
    expect(heading).toHaveClass('sr-only');
    expect(heading).toHaveAttribute('id', 'posts-title');

    const region = screen.getByRole('region', { name: 'Posts' });
    expect(region).toHaveAttribute('aria-labelledby', 'posts-title');
    expect(region).not.toHaveAttribute('aria-label');
  });

  it('renders no pagination nav when the pagination prop is absent', () => {
    setup();

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders Pagination as a sibling of the posts region, inside the same Section', () => {
    setup({
      pagination: {
        currentPage: 2,
        totalPages: 3,
        createHref: (page: number) => `/topics/engineering/page/${page}`,
        ariaLabel: 'Topic pages',
        previousLabel: 'Previous',
        nextLabel: 'Next',
      },
    });

    const heading = screen.getByRole('heading', { name: 'Latest posts' });
    const nav = screen.getByRole('navigation', { name: 'Topic pages' });

    // `PostsSection` renders its own root wrapper around the heading —
    // asserting `nav` sits outside it proves it's a sibling, not nested.
    const postsSectionRoot = heading.parentElement;
    expect(postsSectionRoot?.contains(nav)).toBe(false);
    expect(postsSectionRoot?.parentElement?.contains(nav)).toBe(true);

    const previousLink = screen.getByRole('link', { name: 'Previous' });
    expect(previousLink).toHaveAttribute('href', '/topics/engineering/page/1');
    const nextLink = screen.getByRole('link', { name: 'Next' });
    expect(nextLink).toHaveAttribute('href', '/topics/engineering/page/3');
  });

  it('renders the resolved i18n empty message when items is empty', () => {
    setup({ items: [] });

    expect(screen.getByText('No posts yet.')).toBeInTheDocument();
  });
});
