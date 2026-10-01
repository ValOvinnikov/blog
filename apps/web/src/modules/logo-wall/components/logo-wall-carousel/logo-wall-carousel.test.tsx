import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import { makeLogoItem } from '@web/testing/modules/logo-wall/fixtures';

import { LogoWallCarousel } from './logo-wall-carousel';

vi.mock('@web/i18n/navigation');

const logos = [
  makeLogoItem({ id: 'logo-1', name: 'Acme Corp' }),
  makeLogoItem({ id: 'logo-2', name: 'Nimbus Inc' }),
];

const setup = customRender(LogoWallCarousel, {
  logos,
  tone: BRAND_VARIANT.PRIMARY,
  title: 'Trusted by',
});

describe(`<${LogoWallCarousel.name}/>`, () => {
  it('renders a labelled carousel with one logo per item', async () => {
    setup();

    const region = screen.getByRole('region', { name: 'Trusted by carousel' });
    expect(within(region).getAllByRole('img')).toHaveLength(logos.length);
    logos.forEach((logo) => {
      expect(
        within(region).getByRole('img', { name: logo.name }),
      ).toBeVisible();
    });
    expect(
      await screen.findByRole('button', { name: 'Previous slide' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeVisible();
  });
});
