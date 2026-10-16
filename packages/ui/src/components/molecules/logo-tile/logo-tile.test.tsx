import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { LogoTile } from './logo-tile';

faker.seed(123);

describe(`<${LogoTile.name}/>`, () => {
  it('renders its logo', () => {
    const alt = faker.company.name();
    const setup = customRender(LogoTile, {
      children: (
        <LogoTile.Logo>
          <img src={faker.image.url()} alt={alt} />
        </LogoTile.Logo>
      ),
    });

    setup();

    expect(screen.getByRole('img', { name: alt })).toBeVisible();
  });

  it('renders LogoTile.Link as the one link, named by its label', () => {
    const href = faker.internet.url();
    const setup = customRender(LogoTile, {
      isInteractive: true,
      children: [
        <LogoTile.Logo key="logo">
          <img src={faker.image.url()} alt="" />
        </LogoTile.Logo>,
        <LogoTile.DarkLogo key="dark-logo">
          <img src={faker.image.url()} alt="" />
        </LogoTile.DarkLogo>,
        <LogoTile.Link key="link" href={href} ariaLabel="Visit Acme" />,
      ],
    });

    setup();

    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Visit Acme' })).toHaveAttribute(
      'href',
      href,
    );
  });

  it('adds no accessible name of its own', () => {
    const setup = customRender(LogoTile, {
      children: (
        <LogoTile.Logo>
          <img src={faker.image.url()} alt={faker.company.name()} />
        </LogoTile.Logo>
      ),
      dataTestId: 'logo-tile',
    });

    setup();

    expect(screen.getByTestId('logo-tile')).not.toHaveAccessibleName();
  });

  it('renders both the regular and the dark-background logo, each named', () => {
    const regularAlt = faker.company.name();
    const darkAlt = faker.company.name();
    const setup = customRender(LogoTile, {
      children: [
        <LogoTile.Logo key="logo">
          <img src={faker.image.url()} alt={regularAlt} />
        </LogoTile.Logo>,
        <LogoTile.DarkLogo key="dark-logo">
          <img src={faker.image.url()} alt={darkAlt} />
        </LogoTile.DarkLogo>,
      ],
    });

    setup();

    expect(screen.getByRole('img', { name: regularAlt })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: darkAlt })).toBeInTheDocument();
  });

  it('keeps a child that is not one of its parts', () => {
    const text = faker.company.name();
    const setup = customRender(LogoTile, {
      children: <span>{text}</span>,
    });

    setup();

    expect(screen.getByText(text)).toBeVisible();
  });
});
