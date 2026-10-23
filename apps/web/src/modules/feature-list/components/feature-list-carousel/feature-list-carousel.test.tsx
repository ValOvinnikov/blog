import { CARD_IMAGE_SHAPE } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_FEATURE_LIST_HEADING,
  MOCK_FEATURE_LIST_ITEMS,
} from '@web/testing/modules/feature-list/fixtures';

import { FeatureListCarousel } from './feature-list-carousel';

vi.mock('@web/i18n/navigation');

const setup = customRender(FeatureListCarousel, {
  items: MOCK_FEATURE_LIST_ITEMS,
  imageShape: CARD_IMAGE_SHAPE.WIDE,
  align: 'left',
  imageSizes: '100vw',
  title: MOCK_FEATURE_LIST_HEADING,
});

describe(`<${FeatureListCarousel.name}/>`, () => {
  it('renders a labelled carousel with one card per item', async () => {
    setup();

    const region = screen.getByRole('region', {
      name: `${MOCK_FEATURE_LIST_HEADING} carousel`,
    });
    const cardHeadings = within(region).getAllByRole('heading', { level: 3 });
    expect(cardHeadings).toHaveLength(MOCK_FEATURE_LIST_ITEMS.length);
    MOCK_FEATURE_LIST_ITEMS.forEach((item) => {
      const cardHeading = within(region).getByRole('heading', {
        level: 3,
        name: item.headingBlock.heading,
      });
      expect(cardHeading).toBeVisible();
    });
    const previousButton = await screen.findByRole('button', {
      name: 'Previous slide',
    });
    const nextButton = screen.getByRole('button', { name: 'Next slide' });
    expect(previousButton).toBeVisible();
    expect(nextButton).toBeVisible();
  });
});
