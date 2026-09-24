import { customRender, screen } from '@web/testing/custom-render';
import { makeLogoItem } from '@web/testing/modules/logo-wall/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';

import { LogoWallTile } from './logo-wall-tile';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const item = makeLogoItem();

const setup = customRender(LogoWallTile, { logo: item });

describe(`<${LogoWallTile.name}/>`, () => {
  it('renders the logo image with the company name as its alt', () => {
    setup();

    expect(screen.getByRole('img', { name: item.name })).toBeInTheDocument();
  });

  it('wraps the logo in a link when the item has one, with the company name as its accessible name', () => {
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

  it('renders no link when the item has none', () => {
    setup();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
