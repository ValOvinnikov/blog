import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_LOGO_LINK,
  mockLogoItem,
} from '@web/testing/modules/logo-wall/fixtures';

import { LogoWallTile } from './logo-wall-tile';

vi.mock('@web/i18n/navigation');

faker.seed(6011);

const MOCK_LINK_ARIA_LABEL = faker.lorem.sentence();
const MOCK_ASPECT_RATIO = 2400 / 1260;
const LOGO_TEST_ID = 'logo-wall-tile-logo';
const LOGO_ASPECT_PROPERTY = '--logo-aspect';

const MOCK_LOGO = mockLogoItem();

const MOCK_DARK_IMAGE = mockSanityImage({
  assetId: 'image-9b1d3f0c2e7a4b5c8d6e1f2a3b4c5d6e7f8a9b0c-1800x400-png',
  alt: MOCK_LOGO.name,
});

const setup = customRender(LogoWallTile, { logo: MOCK_LOGO });

describe(`<${LogoWallTile.name}/>`, () => {
  describe('with the default logo', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the logo image with the company name as its alt', () => {
      const logoImage = screen.getByRole('img', { name: MOCK_LOGO.name });
      expect(logoImage).toBeVisible();
    });

    it('renders no link when the item has none', () => {
      const link = screen.queryByRole('link');
      expect(link).not.toBeInTheDocument();
    });
  });

  it('names the link by its aria label override when one is set', () => {
    setup({
      logo: mockLogoItem({
        link: { ...MOCK_LOGO_LINK, ariaLabel: MOCK_LINK_ARIA_LABEL },
      }),
    });

    const link = screen.getByRole('link', {
      name: MOCK_LINK_ARIA_LABEL,
    });
    expect(link).toHaveAttribute('href', MOCK_LOGO_LINK.href);
  });

  describe('with a linked logo', () => {
    beforeEach(() => {
      setup({ logo: mockLogoItem({ link: MOCK_LOGO_LINK }) });
    });

    it('names the link by the company when it has no aria label override', () => {
      const link = screen.getByRole('link', { name: MOCK_LOGO.name });
      expect(link).toHaveAttribute('href', MOCK_LOGO_LINK.href);
    });

    it('renders the logo as decorative when the item has a link', () => {
      const logoImage = screen.queryByRole('img');
      expect(logoImage).not.toBeInTheDocument();
    });
  });

  it('pins the logo to the asset aspect ratio', () => {
    setup({
      logo: mockLogoItem({
        image: mockSanityImage({
          dimensions: {
            width: 2400,
            height: 1260,
            aspectRatio: MOCK_ASPECT_RATIO,
          },
        }),
      }),
    });

    const logo = screen.getByTestId(LOGO_TEST_ID);
    const aspectRatio = logo.style.getPropertyValue(LOGO_ASPECT_PROPERTY);

    expect(aspectRatio).toBe(String(MOCK_ASPECT_RATIO));
  });

  it.each([
    ['the asset has no dimensions', undefined],
    [
      'the aspect ratio is not positive',
      { width: 0, height: 0, aspectRatio: 0 },
    ],
    [
      'the asset aspect ratio is not finite',
      { width: Infinity, height: 0, aspectRatio: Infinity },
    ],
  ])('falls back to the contained layout when %s', (_, dimensions) => {
    setup({ logo: mockLogoItem({ image: mockSanityImage({ dimensions }) }) });

    const logo = screen.getByTestId(LOGO_TEST_ID);
    const aspectRatio = logo.style.getPropertyValue(LOGO_ASPECT_PROPERTY);

    expect(aspectRatio).toBe('');
  });

  it('renders the dark-background logo beside the regular one when set', () => {
    setup({ logo: mockLogoItem({ imageDark: MOCK_DARK_IMAGE }) });

    const logoImages = screen.getAllByRole('img', { name: MOCK_LOGO.name });
    expect(logoImages).toHaveLength(2);
  });

  it('renders one link for a linked item with a dark-background logo', () => {
    setup({
      logo: mockLogoItem({ imageDark: MOCK_DARK_IMAGE, link: MOCK_LOGO_LINK }),
    });

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
  });
});
