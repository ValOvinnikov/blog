import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { LogoTile } from './logo-tile';

faker.seed(123);

const MOCK_LOGO_ALT = faker.company.name();
const MOCK_DARK_LOGO_ALT = faker.company.name();
const MOCK_LOGO_SRC = faker.image.url();
const MOCK_DARK_LOGO_SRC = faker.image.url();
const MOCK_LINK_LABEL = faker.lorem.words(2);
const MOCK_HREF = faker.internet.url();
const MOCK_TEXT = faker.lorem.words(2);
const LOGO_TILE_TEST_ID = 'logo-tile';

const setup = customRender(LogoTile, {});

describe(`<${LogoTile.name}/>`, () => {
  it('renders its logo', () => {
    setup({
      children: (
        <LogoTile.Logo>
          <img src={MOCK_LOGO_SRC} alt={MOCK_LOGO_ALT} />
        </LogoTile.Logo>
      ),
    });

    const logo = screen.getByRole('img', { name: MOCK_LOGO_ALT });

    expect(logo).toBeVisible();
  });

  it('renders LogoTile.Link as the one link, named by its label', () => {
    setup({
      isInteractive: true,
      children: [
        <LogoTile.Logo key="logo">
          <img src={MOCK_LOGO_SRC} alt="" />
        </LogoTile.Logo>,
        <LogoTile.DarkLogo key="dark-logo">
          <img src={MOCK_DARK_LOGO_SRC} alt="" />
        </LogoTile.DarkLogo>,
        <LogoTile.Link
          key="link"
          href={MOCK_HREF}
          ariaLabel={MOCK_LINK_LABEL}
        />,
      ],
    });

    const links = screen.getAllByRole('link');
    const link = screen.getByRole('link', { name: MOCK_LINK_LABEL });

    expect(links).toHaveLength(1);
    expect(link).toHaveAttribute('href', MOCK_HREF);
  });

  it('adds no accessible name of its own', () => {
    setup({
      dataTestId: LOGO_TILE_TEST_ID,
      children: (
        <LogoTile.Logo>
          <img src={MOCK_LOGO_SRC} alt={MOCK_LOGO_ALT} />
        </LogoTile.Logo>
      ),
    });

    const tile = screen.getByTestId(LOGO_TILE_TEST_ID);

    expect(tile).not.toHaveAccessibleName();
  });

  it('renders both the regular and the dark-background logo, each named', () => {
    setup({
      children: [
        <LogoTile.Logo key="logo">
          <img src={MOCK_LOGO_SRC} alt={MOCK_LOGO_ALT} />
        </LogoTile.Logo>,
        <LogoTile.DarkLogo key="dark-logo">
          <img src={MOCK_DARK_LOGO_SRC} alt={MOCK_DARK_LOGO_ALT} />
        </LogoTile.DarkLogo>,
      ],
    });

    const logo = screen.getByRole('img', { name: MOCK_LOGO_ALT });
    const darkLogo = screen.getByRole('img', { name: MOCK_DARK_LOGO_ALT });

    expect(logo).toBeVisible();
    expect(darkLogo).toBeVisible();
  });

  it('keeps a child that is not one of its parts', () => {
    setup({ children: <span>{MOCK_TEXT}</span> });

    const text = screen.getByText(MOCK_TEXT);

    expect(text).toBeVisible();
  });
});
