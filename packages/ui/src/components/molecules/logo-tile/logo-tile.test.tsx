import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { LogoTile } from './logo-tile';

faker.seed(123);

describe(`<${LogoTile.name}/>`, () => {
  it('renders its child untouched', () => {
    const alt = faker.company.name();
    const setup = customRender(LogoTile, {
      children: <img src={faker.image.url()} alt={alt} />,
    });

    setup();

    expect(screen.getByRole('img', { name: alt })).toBeVisible();
  });

  it('adds no link role of its own around a linked child', () => {
    const setup = customRender(LogoTile, {
      children: (
        <a href={faker.internet.url()}>
          <img src={faker.image.url()} alt={faker.company.name()} />
        </a>
      ),
    });

    setup();

    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('renders LogoTile.Link as the one link, named by its label', () => {
    const href = faker.internet.url();
    const setup = customRender(LogoTile, {
      isInteractive: true,
      children: (
        <LogoTile.Link href={href} ariaLabel="Visit Acme">
          <img src={faker.image.url()} alt="" />
        </LogoTile.Link>
      ),
    });

    setup();

    expect(screen.getByRole('link', { name: 'Visit Acme' })).toHaveAttribute(
      'href',
      href,
    );
  });

  it('adds no accessible name of its own', () => {
    const setup = customRender(LogoTile, {
      children: <img src={faker.image.url()} alt={faker.company.name()} />,
      dataTestId: 'logo-tile',
    });

    setup();

    expect(screen.getByTestId('logo-tile')).not.toHaveAccessibleName();
  });

  it('renders a single logo when it has no dark-background logo', () => {
    const setup = customRender(LogoTile, {
      children: <img src={faker.image.url()} alt={faker.company.name()} />,
    });

    setup();

    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('renders both the regular and the dark-background logo, each named', () => {
    const regularAlt = faker.company.name();
    const darkAlt = faker.company.name();
    const setup = customRender(LogoTile, {
      children: <img src={faker.image.url()} alt={regularAlt} />,
      darkLogo: <img src={faker.image.url()} alt={darkAlt} />,
    });

    setup();

    expect(screen.getByRole('img', { name: regularAlt })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: darkAlt })).toBeInTheDocument();
  });
});
