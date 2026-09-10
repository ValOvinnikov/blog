import { BRAND_VARIANT, DISPLAY_MODE } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makePostListItem } from '@web/testing/modules/post-list/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { PostLatestModuleView } from './post-latest-module-view';

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

const { PostsCarousel } = vi.hoisted(() => ({
  PostsCarousel: vi.fn(() => <div data-testid="posts-carousel-stub" />),
}));

vi.mock('@web/components/shared/posts-carousel', () => ({ PostsCarousel }));

beforeEach(() => {
  PostsCarousel.mockClear();
});

const post = makePostListItem();

const setup = customRender(PostLatestModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'Latest posts' }),
  items: [post],
  layout: undefined,
  contentAlignment: undefined,
  titleId: 'latest-posts-title',
  dataTestId: 'post-latest-module-post-latest-1',
  accessibleTitle: 'Latest posts',
  displayMode: DISPLAY_MODE.GRID,
});

describe(`<${PostLatestModuleView.name}/>`, () => {
  it('labels the section with the given titleId', () => {
    setup();

    const label = screen.getByText('Latest posts');
    expect(label).toHaveAttribute('id', 'latest-posts-title');
    expect(label.tagName).toBe('H2');

    const section = label.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'latest-posts-title');
    expect(section).toHaveAttribute(
      'data-testid',
      'post-latest-module-post-latest-1',
    );
    expect(
      screen.getByRole('region', { name: 'Latest posts' }),
    ).toBeInTheDocument();
  });

  it('renders a visually hidden heading from accessibleTitle when headingBlock.heading is undefined', () => {
    setup({
      headingBlock: makeHeadingBlock(),
    });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Latest posts',
    });
    expect(heading).toHaveClass('sr-only');
    expect(
      screen.getByRole('region', { name: 'Latest posts' }),
    ).toBeInTheDocument();
  });

  it('renders a card per item, linked to its href', () => {
    setup();

    const link = screen.getByRole('link', { name: post.title });
    expect(link).toHaveAttribute('href', post.href);
    expect(
      screen.getByRole('heading', { level: 3, name: post.title }),
    ).toBeInTheDocument();
  });

  it('never renders a pagination nav', () => {
    setup();

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
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

  it('renders PostsCarousel with the view items when displayMode is CAROUSEL', () => {
    setup({ displayMode: DISPLAY_MODE.CAROUSEL });

    expect(screen.getByTestId('posts-carousel-stub')).toBeInTheDocument();
    expect(PostsCarousel).toHaveBeenCalledWith(
      expect.objectContaining({ items: [post] }),
      undefined,
    );
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('never renders PostsCarousel when displayMode is GRID', () => {
    setup();

    expect(PostsCarousel).not.toHaveBeenCalled();
  });
});
