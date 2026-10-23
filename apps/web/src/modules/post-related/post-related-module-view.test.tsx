import { BRAND_VARIANT } from '@blog/config';
import { MEDIA_CARD_MEDIA_TEST_ID } from '@web/constants/media-card';
import { customRender, screen } from '@web/testing/custom-render';
import { mockPostListItem } from '@web/testing/modules/post-list/fixtures';
import { MOCK_POST_RELATED_HEADING } from '@web/testing/modules/post-related/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { PostRelatedModuleView } from './post-related-module-view';

vi.mock('@web/i18n/navigation');

const TITLE_ID = 'related-posts-title';
const DATA_TEST_ID = 'post-related-module-post-related-1';

const post = mockPostListItem();

const setup = customRender(PostRelatedModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_POST_RELATED_HEADING }),
  items: [post],
  layout: undefined,
  contentAlignment: undefined,
  titleId: TITLE_ID,
  dataTestId: DATA_TEST_ID,
});

describe(`<${PostRelatedModuleView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with the given titleId', () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_POST_RELATED_HEADING,
      });
      expect(heading).toHaveAttribute('id', TITLE_ID);

      const section = screen.getByRole('region', {
        name: MOCK_POST_RELATED_HEADING,
      });
      expect(section).toBeVisible();
      expect(section).toHaveAttribute('aria-labelledby', TITLE_ID);
      expect(section).toHaveAttribute('data-testid', DATA_TEST_ID);
    });

    it('renders a card per item, linked to its href', () => {
      const link = screen.getByRole('link', { name: post.title });
      expect(link).toHaveAttribute('href', post.href);
      const cardHeading = screen.getByRole('heading', {
        level: 3,
        name: post.title,
      });
      expect(cardHeading).toBeVisible();
    });

    it('never renders a pagination nav', () => {
      const pagination = screen.queryByRole('navigation');
      expect(pagination).not.toBeInTheDocument();
    });

    it('renders no media region when hasImages is not given', () => {
      const media = screen.queryByTestId(MEDIA_CARD_MEDIA_TEST_ID);
      expect(media).not.toBeInTheDocument();
    });
  });

  it('renders a media region for each item when hasImages is true', () => {
    setup({
      hasImages: true,
      items: [{ ...post, image: <div data-testid="post-image" /> }],
    });

    const media = screen.getByTestId(MEDIA_CARD_MEDIA_TEST_ID);
    const image = screen.getByTestId('post-image');
    expect(media).toBeVisible();
    expect(image).toBeVisible();
  });
});
