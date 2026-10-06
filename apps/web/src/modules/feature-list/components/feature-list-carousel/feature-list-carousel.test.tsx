import { CARD_IMAGE_SHAPE } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import { makeFeatureListItem } from '@web/testing/modules/feature-list/fixtures';

import { FeatureListCarousel } from './feature-list-carousel';

vi.mock('@web/i18n/navigation');

const items = [
  makeFeatureListItem({
    id: 'feature-1',
    headingBlock: { heading: 'Fast by default' },
  }),
  makeFeatureListItem({
    id: 'feature-2',
    headingBlock: { heading: 'Built for scale' },
  }),
];

const setup = customRender(FeatureListCarousel, {
  items,
  imageShape: CARD_IMAGE_SHAPE.WIDE,
  align: 'left',
  imageSizes: '100vw',
  title: 'Why choose us',
});

describe(`<${FeatureListCarousel.name}/>`, () => {
  it('renders a labelled carousel with one card per item', async () => {
    setup();

    const region = screen.getByRole('region', {
      name: 'Why choose us carousel',
    });
    expect(within(region).getAllByRole('heading', { level: 3 })).toHaveLength(
      items.length,
    );
    items.forEach((item) => {
      expect(
        within(region).getByRole('heading', {
          level: 3,
          name: item.headingBlock.heading,
        }),
      ).toBeVisible();
    });
    expect(
      await screen.findByRole('button', { name: 'Previous slide' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeVisible();
  });
});
