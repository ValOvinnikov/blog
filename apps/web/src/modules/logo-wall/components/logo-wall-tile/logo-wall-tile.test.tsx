import { customRender, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeLogoItem } from '@web/testing/modules/logo-wall/fixtures';

import { LogoWallTile } from './logo-wall-tile';

vi.mock('@web/i18n/navigation');

const item = makeLogoItem();

const setup = customRender(LogoWallTile, { logo: item });

describe(`<${LogoWallTile.name}/>`, () => {
  describe('with the default logo', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the logo image with the company name as its alt', () => {
      expect(screen.getByRole('img', { name: item.name })).toBeVisible();
    });

    it('renders no link when the item has none', () => {
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  it('wraps the logo in a link named by the company when the item has one', () => {
    setup({
      logo: makeLogoItem({
        link: {
          label: 'Visit Acme Corp',
          href: 'https://acme.example.com',
          target: undefined,
          platform: undefined,
          ariaLabel: undefined,
        },
      }),
    });

    const link = screen.getByRole('link', { name: item.name });
    expect(link).toHaveAttribute('href', 'https://acme.example.com');
  });

  it('exposes the link under its ariaLabel override when the item link sets one', () => {
    setup({
      logo: makeLogoItem({
        link: {
          label: 'Visit Acme Corp',
          href: 'https://acme.example.com',
          target: undefined,
          platform: undefined,
          ariaLabel: 'Visit the Acme Corp website',
        },
      }),
    });

    expect(
      screen.getByRole('link', { name: 'Visit the Acme Corp website' }),
    ).toHaveAttribute('href', 'https://acme.example.com');
  });

  it('pins the tile to the logo asset aspect ratio', () => {
    setup({
      logo: makeLogoItem({
        image: makeSanityImage({
          dimensions: { width: 2400, height: 1260, aspectRatio: 2400 / 1260 },
        }),
      }),
    });

    expect(
      screen
        .getByTestId('logo-wall-tile')
        .style.getPropertyValue('--logo-aspect'),
    ).toBe(String(2400 / 1260));
  });

  it('falls back to the contained layout when the asset has no dimensions', () => {
    setup({
      logo: makeLogoItem({
        image: makeSanityImage({ dimensions: undefined }),
      }),
    });

    expect(
      screen
        .getByTestId('logo-wall-tile')
        .style.getPropertyValue('--logo-aspect'),
    ).toBe('');
  });

  it('falls back to the contained layout when the aspect ratio is not positive', () => {
    setup({
      logo: makeLogoItem({
        image: makeSanityImage({
          dimensions: { width: 0, height: 0, aspectRatio: 0 },
        }),
      }),
    });

    expect(
      screen
        .getByTestId('logo-wall-tile')
        .style.getPropertyValue('--logo-aspect'),
    ).toBe('');
  });

  it('falls back to the contained layout when the asset aspect ratio is not finite', () => {
    setup({
      logo: makeLogoItem({
        image: makeSanityImage({
          dimensions: { width: Infinity, height: 0, aspectRatio: Infinity },
        }),
      }),
    });

    expect(
      screen
        .getByTestId('logo-wall-tile')
        .style.getPropertyValue('--logo-aspect'),
    ).toBe('');
  });

  it('renders the dark-background logo alongside the regular one when the item has one', () => {
    setup({
      logo: makeLogoItem({
        imageDark: makeSanityImage({
          assetId:
            'image-9b1d3f0c2e7a4b5c8d6e1f2a3b4c5d6e7f8a9b0c-1800x400-png',
          alt: item.name,
        }),
      }),
    });

    expect(screen.getAllByRole('img', { name: item.name })).toHaveLength(2);
  });

  it('wraps the dark-background logo in the item link too', () => {
    setup({
      logo: makeLogoItem({
        imageDark: makeSanityImage({
          assetId:
            'image-9b1d3f0c2e7a4b5c8d6e1f2a3b4c5d6e7f8a9b0c-1800x400-png',
          alt: item.name,
        }),
        link: {
          label: 'Visit Acme Corp',
          href: 'https://acme.example.com',
          target: undefined,
          platform: undefined,
          ariaLabel: undefined,
        },
      }),
    });

    expect(screen.getAllByRole('link', { name: item.name })).toHaveLength(2);
  });
});
