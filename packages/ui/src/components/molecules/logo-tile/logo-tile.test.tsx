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

  it('adds no accessible name of its own', () => {
    const setup = customRender(LogoTile, {
      children: <img src={faker.image.url()} alt={faker.company.name()} />,
      dataTestId: 'logo-tile',
    });

    setup();

    expect(screen.getByTestId('logo-tile')).not.toHaveAccessibleName();
  });
});
