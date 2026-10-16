import type { ILink } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeLogoItem } from '@web/testing/modules/logo-wall/fixtures';

import { LogoWallTile } from './logo-wall-tile';

vi.mock('@web/i18n/navigation');

const item = makeLogoItem();

const link: ILink = {
  label: 'Visit Acme Corp',
  href: 'https://acme.example.com',
  target: undefined,
  platform: undefined,
  ariaLabel: undefined,
};

const darkImage = makeSanityImage({
  assetId: 'image-9b1d3f0c2e7a4b5c8d6e1f2a3b4c5d6e7f8a9b0c-1800x400-png',
  alt: item.name,
});

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

  it('names the link by the company when the item link has no ariaLabel', () => {
    setup({ logo: makeLogoItem({ link }) });

    expect(screen.getByRole('link', { name: item.name })).toHaveAttribute(
      'href',
      'https://acme.example.com',
    );
  });

  it('exposes the link under its ariaLabel override when the item link sets one', () => {
    setup({
      logo: makeLogoItem({
        link: { ...link, ariaLabel: 'Visit the Acme Corp website' },
      }),
    });

    expect(
      screen.getByRole('link', { name: 'Visit the Acme Corp website' }),
    ).toHaveAttribute('href', 'https://acme.example.com');
  });

  it('renders the logo as decorative when the item has a link', () => {
    setup({ logo: makeLogoItem({ link }) });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('pins the logo to the asset aspect ratio', () => {
    setup({
      logo: makeLogoItem({
        image: makeSanityImage({
          dimensions: { width: 2400, height: 1260, aspectRatio: 2400 / 1260 },
        }),
      }),
    });

    expect(
      screen
        .getByTestId('logo-wall-tile-logo')
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
        .getByTestId('logo-wall-tile-logo')
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
        .getByTestId('logo-wall-tile-logo')
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
        .getByTestId('logo-wall-tile-logo')
        .style.getPropertyValue('--logo-aspect'),
    ).toBe('');
  });

  it('renders the dark-background logo alongside the regular one when the item has one', () => {
    setup({ logo: makeLogoItem({ imageDark: darkImage }) });

    expect(screen.getAllByRole('img', { name: item.name })).toHaveLength(2);
  });

  it('renders one link for a linked item with a dark-background logo', () => {
    setup({ logo: makeLogoItem({ imageDark: darkImage, link }) });

    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});
