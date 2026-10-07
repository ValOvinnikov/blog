import { BRAND_VARIANT, DISPLAY_MODE } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import { makePostListItem } from '@web/testing/modules/post-list/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { PostLatestModuleView } from './post-latest-module-view';

vi.mock('@web/i18n/navigation');

const post = makePostListItem();

const setup = customRender(PostLatestModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'Latest posts' }),
  items: [post],
  layout: undefined,
  contentAlignment: undefined,
  titleId: 'latest-posts-title',
  dataTestId: 'post-latest-module-post-latest-1',
  displayMode: DISPLAY_MODE.GRID,
});

describe(`<${PostLatestModuleView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with the given titleId', () => {
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
      ).toBeVisible();
    });

    it('renders a card per item, linked to its href', () => {
      const link = screen.getByRole('link', { name: post.title });
      expect(link).toHaveAttribute('href', post.href);
      expect(
        screen.getByRole('heading', { level: 3, name: post.title }),
      ).toBeVisible();
    });

    it('never renders a pagination nav', () => {
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('renders no media region when hasImages is not given', () => {
      expect(screen.queryByTestId('media-card-media')).not.toBeInTheDocument();
    });

    it('renders no carousel when displayMode is GRID', () => {
      expect(
        screen.queryByRole('region', { name: 'Latest posts carousel' }),
      ).not.toBeInTheDocument();
    });
  });

  it('renders a media region for each item when hasImages is true', () => {
    setup({
      hasImages: true,
      items: [{ ...post, image: <div data-testid="post-image" /> }],
    });

    expect(screen.getByTestId('media-card-media')).toBeVisible();
    expect(screen.getByTestId('post-image')).toBeVisible();
  });

  it('renders the items as a labelled carousel when displayMode is CAROUSEL', async () => {
    const secondPost = makePostListItem({ id: 'post-2', title: 'Second post' });
    setup({ items: [post, secondPost], displayMode: DISPLAY_MODE.CAROUSEL });

    const region = screen.getByRole('region', {
      name: 'Latest posts carousel',
    });
    expect(within(region).getAllByRole('article')).toHaveLength(2);
    expect(
      await screen.findByRole('button', { name: 'Previous slide' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeVisible();
  });
});
