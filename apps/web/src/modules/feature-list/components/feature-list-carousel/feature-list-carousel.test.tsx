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
  beforeEach(() => {
    setup();
  });

  it('renders a labelled carousel with one card per item', () => {
    const region = screen.getByRole('region', {
      name: `${MOCK_FEATURE_LIST_HEADING} carousel`,
    });
    const cardHeadings = within(region).getAllByRole('heading', { level: 3 });

    expect(cardHeadings).toHaveLength(MOCK_FEATURE_LIST_ITEMS.length);
  });

  it.each(MOCK_FEATURE_LIST_ITEMS)(
    'renders the card titled $headingBlock.heading',
    ({ headingBlock }) => {
      const cardHeading = screen.getByRole('heading', {
        level: 3,
        name: headingBlock.heading,
      });

      expect(cardHeading).toBeVisible();
    },
  );

  it('renders previous and next slide controls', async () => {
    const previousButton = await screen.findByRole('button', {
      name: 'Previous slide',
    });
    const nextButton = screen.getByRole('button', { name: 'Next slide' });

    expect(previousButton).toBeVisible();
    expect(nextButton).toBeVisible();
  });
});
