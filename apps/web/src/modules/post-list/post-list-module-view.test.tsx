import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import { makePostListItem } from '@web/testing/modules/post-list/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { PostListModuleView } from './post-list-module-view';

vi.mock('@web/i18n/navigation');

const post = makePostListItem();

const setup = customRender(PostListModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'Latest posts' }),
  items: [post],
  layout: undefined,
  contentAlignment: undefined,
  titleId: 'posts-title',
  dataTestId: 'post-list-module-post-list-1',
  emptyMessage: 'No posts yet.',
});

describe(`<${PostListModuleView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with the given titleId', () => {
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
      ).toBeVisible();
    });

    it('renders a card per item, linked to its href', () => {
      const link = screen.getByRole('link', { name: post.title });
      expect(link).toHaveAttribute('href', post.href);
      expect(
        screen.getByRole('heading', { level: 3, name: post.title }),
      ).toBeVisible();
    });

    it('renders no pagination nav when the pagination prop is absent', () => {
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('renders no media region when hasImages is not given', () => {
      expect(screen.queryByTestId('media-card-media')).not.toBeInTheDocument();
    });
  });

  it('derives a different section id from a different titleId, avoiding duplicate ids', () => {
    setup({
      titleId: 'other-posts-title',
      headingBlock: makeHeadingBlock({ heading: 'More posts' }),
    });

    expect(screen.getByText('More posts')).toHaveAttribute(
      'id',
      'other-posts-title',
    );
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
    expect(nav).toBeVisible();
  });

  it('renders the resolved i18n empty message instead of the grid when items is empty', () => {
    setup({ items: [] });

    expect(screen.getByText('No posts yet.')).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a media region for each item when hasImages is true', () => {
    setup({
      hasImages: true,
      items: [{ ...post, image: <div data-testid="post-image" /> }],
    });

    expect(screen.getByTestId('media-card-media')).toBeVisible();
    expect(screen.getByTestId('post-image')).toBeVisible();
  });
});
