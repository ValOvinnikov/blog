import { faker } from '@faker-js/faker';
import { MEDIA_CARD_MEDIA_TEST_ID } from '@web/constants/media-card';
import { customRender, screen, within } from '@web/testing/custom-render';
import { mockPostListItem } from '@web/testing/modules/post-list/fixtures';

import { CardCarousel } from './card-carousel';

vi.mock('@web/i18n/navigation');

faker.seed(6007);

const MOCK_TITLE = faker.lorem.words(2);
const MOCK_IMAGE_TEST_ID = faker.string.uuid();
const MOCK_ITEMS = [
  mockPostListItem({ id: faker.string.uuid(), title: faker.lorem.words(3) }),
  mockPostListItem({ id: faker.string.uuid(), title: faker.lorem.words(3) }),
];

const setup = customRender(CardCarousel, {
  items: MOCK_ITEMS,
  title: MOCK_TITLE,
});

describe(`<${CardCarousel.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a labelled carousel with one card per item', () => {
      const region = screen.getByRole('region', {
        name: `${MOCK_TITLE} carousel`,
      });
      const cards = within(region).getAllByRole('article');

      expect(cards).toHaveLength(MOCK_ITEMS.length);
      MOCK_ITEMS.forEach((item, index) => {
        expect(cards[index]).toHaveTextContent(item.title);
      });
    });

    it('offers previous and next slide controls', async () => {
      const previousButton = await screen.findByRole('button', {
        name: 'Previous slide',
      });
      const nextButton = screen.getByRole('button', { name: 'Next slide' });

      expect(previousButton).toBeVisible();
      expect(nextButton).toBeVisible();
    });
  });

  it('renders a media region with the item image when images are requested', () => {
    setup({
      items: [
        mockPostListItem({ image: <div data-testid={MOCK_IMAGE_TEST_ID} /> }),
      ],
      hasImages: true,
    });

    const media = screen.getByTestId(MEDIA_CARD_MEDIA_TEST_ID);
    const image = screen.getByTestId(MOCK_IMAGE_TEST_ID);

    expect(media).toBeVisible();
    expect(image).toBeVisible();
  });
});
