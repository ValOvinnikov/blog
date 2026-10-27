import { BRAND_VARIANT } from '@blog/config';
import { faker } from '@faker-js/faker';
import { MEDIA_CARD_MEDIA_TEST_ID } from '@web/constants/media-card';
import { customRender, screen } from '@web/testing/custom-render';
import { mockPostListItem } from '@web/testing/modules/post-list/fixtures';
import { MOCK_POST_RELATED_HEADING } from '@web/testing/modules/post-related/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_POST_IMAGE_TEST_ID } from '@web/testing/shared/post/fixtures';

import { PostRelatedModuleView } from './post-related-module-view';

vi.mock('@web/i18n/navigation');

faker.seed(6011);

const MOCK_TITLE_ID = faker.lorem.slug();
const MOCK_DATA_TEST_ID = faker.lorem.slug();

const MOCK_POST_ITEM = mockPostListItem({ id: faker.string.uuid() });

const setup = customRender(PostRelatedModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_POST_RELATED_HEADING }),
  items: [MOCK_POST_ITEM],
  layout: undefined,
  contentAlignment: undefined,
  titleId: MOCK_TITLE_ID,
  dataTestId: MOCK_DATA_TEST_ID,
});

describe(`<${PostRelatedModuleView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with its heading', () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_POST_RELATED_HEADING,
      });
      const section = screen.getByRole('region', {
        name: MOCK_POST_RELATED_HEADING,
      });

      expect(heading).toHaveAttribute('id', MOCK_TITLE_ID);
      expect(section).toBeVisible();
      expect(section).toHaveAttribute('aria-labelledby', MOCK_TITLE_ID);
    });

    it('renders a card per item, linked to its href', () => {
      const link = screen.getByRole('link', { name: MOCK_POST_ITEM.title });
      const cardHeading = screen.getByRole('heading', {
        level: 3,
        name: MOCK_POST_ITEM.title,
      });

      expect(link).toHaveAttribute('href', MOCK_POST_ITEM.href);
      expect(cardHeading).toBeVisible();
    });

    it('never renders a pagination nav', () => {
      const pagination = screen.queryByRole('navigation');

      expect(pagination).not.toBeInTheDocument();
    });

    it('renders no media region by default', () => {
      const media = screen.queryByTestId(MEDIA_CARD_MEDIA_TEST_ID);

      expect(media).not.toBeInTheDocument();
    });
  });

  it('renders a media region for each item when images are enabled', () => {
    setup({
      hasImages: true,
      items: [
        {
          ...MOCK_POST_ITEM,
          image: <div data-testid={MOCK_POST_IMAGE_TEST_ID} />,
        },
      ],
    });

    const media = screen.getByTestId(MEDIA_CARD_MEDIA_TEST_ID);
    const image = screen.getByTestId(MOCK_POST_IMAGE_TEST_ID);

    expect(media).toBeVisible();
    expect(image).toBeVisible();
  });
});
