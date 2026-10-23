import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_LOGO_ITEMS,
  MOCK_LOGO_WALL_HEADING,
} from '@web/testing/modules/logo-wall/fixtures';

import { LogoWallCarousel } from './logo-wall-carousel';

vi.mock('@web/i18n/navigation');

const setup = customRender(LogoWallCarousel, {
  logos: MOCK_LOGO_ITEMS,
  tone: BRAND_VARIANT.PRIMARY,
  title: MOCK_LOGO_WALL_HEADING,
});

describe(`<${LogoWallCarousel.name}/>`, () => {
  it('renders a labelled carousel with one logo per item', async () => {
    setup();

    const region = screen.getByRole('region', {
      name: `${MOCK_LOGO_WALL_HEADING} carousel`,
    });
    const logoImages = within(region).getAllByRole('img');
    expect(logoImages).toHaveLength(MOCK_LOGO_ITEMS.length);
    MOCK_LOGO_ITEMS.forEach((logo) => {
      const logoImage = within(region).getByRole('img', { name: logo.name });
      expect(logoImage).toBeVisible();
    });
    const previousButton = await screen.findByRole('button', {
      name: 'Previous slide',
    });
    const nextButton = screen.getByRole('button', { name: 'Next slide' });
    expect(previousButton).toBeVisible();
    expect(nextButton).toBeVisible();
  });
});
