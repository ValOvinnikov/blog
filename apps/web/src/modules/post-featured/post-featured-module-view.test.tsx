import { BRAND_VARIANT, DISPLAY_MODE } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import { makePostListItem } from '@web/testing/modules/post-list/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { PostFeaturedModuleView } from './post-featured-module-view';

vi.mock('@web/i18n/navigation');

const leadPost = makePostListItem({
  id: 'post-1',
  title: 'Lead post',
  excerpt: 'Lead excerpt',
  image: <div data-testid="lead-image" />,
});
const secondPost = makePostListItem({
  id: 'post-2',
  title: 'Second post',
  excerpt: 'Second excerpt',
  image: <div data-testid="second-image" />,
});
const thirdPost = makePostListItem({
  id: 'post-3',
  title: 'Third post',
  excerpt: 'Third excerpt',
});

const setup = customRender(PostFeaturedModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'Featured' }),
  items: [leadPost],
  layout: undefined,
  contentAlignment: undefined,
  titleId: 'featured-posts-title',
  dataTestId: 'post-featured-module-featured-1',
  displayMode: DISPLAY_MODE.GRID,
});

describe(`<${PostFeaturedModuleView.name}/>`, () => {
  it('labels the section with the given titleId', () => {
    setup();

    const label = screen.getByText('Featured');
    expect(label).toHaveAttribute('id', 'featured-posts-title');
    expect(label.tagName).toBe('H2');

    const section = label.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'featured-posts-title');
    expect(section).toHaveAttribute(
      'data-testid',
      'post-featured-module-featured-1',
    );
    expect(screen.getByRole('region', { name: 'Featured' })).toBeVisible();
  });

  it('renders the first item as a lead card with a level-3 heading link', () => {
    setup();

    const link = screen.getByRole('link', { name: 'Lead post' });
    expect(link).toHaveAttribute('href', leadPost.href);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Lead post' }),
    ).toBeVisible();
  });

  it('renders nothing (no lead group, no cards) when items is empty', () => {
    setup({ items: [] });

    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(
      screen.queryByTestId('post-featured-module-featured-1-lead'),
    ).not.toBeInTheDocument();
  });

  it('renders only the lead card when exactly one item resolves', () => {
    setup({ items: [leadPost] });

    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(
      screen.getByTestId('post-featured-module-featured-1-lead'),
    ).toBeVisible();
    expect(
      screen.queryByTestId('post-featured-module-featured-1-tail'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('post-featured-module-featured-1-tail-grid'),
    ).not.toBeInTheDocument();
  });

  it('renders exactly one tail card when two items resolve', () => {
    setup({ items: [leadPost, secondPost], hasImages: true });

    expect(screen.getByText('Lead post')).toBeVisible();
    expect(screen.getByText('Second post')).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(
      screen.queryByTestId('post-featured-module-featured-1-tail-grid'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('post-featured-module-featured-1-tail'),
    ).toBeVisible();
  });

  it('renders the remaining posts in a grid when three or more resolve', () => {
    setup({ items: [leadPost, secondPost, thirdPost] });

    const tailGrid = screen.getByTestId(
      'post-featured-module-featured-1-tail-grid',
    );

    expect(within(tailGrid).getByText('Second post')).toBeVisible();
    expect(within(tailGrid).getByText('Third post')).toBeVisible();
    expect(within(tailGrid).queryByText('Lead post')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('renders no media region when hasImages is not given', () => {
    setup();

    expect(screen.queryByTestId('media-card-media')).not.toBeInTheDocument();
  });

  it('renders a media region for the lead card when hasImages is true', () => {
    setup({ hasImages: true });

    expect(screen.getByTestId('media-card-media')).toBeVisible();
    expect(screen.getByTestId('lead-image')).toBeVisible();
  });

  it('renders the items as a labelled carousel when displayMode is CAROUSEL', async () => {
    setup({
      items: [leadPost, secondPost, thirdPost],
      displayMode: DISPLAY_MODE.CAROUSEL,
    });

    const region = screen.getByRole('region', { name: 'Featured carousel' });
    expect(within(region).getAllByRole('article')).toHaveLength(3);
    expect(
      screen.queryByTestId('post-featured-module-featured-1-lead'),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Previous slide' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeVisible();
  });

  it('renders no carousel when displayMode is GRID', () => {
    setup();

    expect(
      screen.queryByRole('region', { name: 'Featured carousel' }),
    ).not.toBeInTheDocument();
  });
});
