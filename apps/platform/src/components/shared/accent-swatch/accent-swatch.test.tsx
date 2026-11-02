import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { AccentSwatch } from './accent-swatch';

faker.seed(6330);

const MOCK_NAME = faker.lorem.words(2);

const setup = customRender(AccentSwatch, { hue: 28 });

describe(`<${AccentSwatch.name}/>`, () => {
  it('is an image with a name when given one', () => {
    setup({ name: MOCK_NAME });

    const swatch = screen.getByRole('img', { name: MOCK_NAME });

    expect(swatch).toBeVisible();
  });

  it('is hidden from assistive technology without a name', () => {
    setup();

    const swatch = screen.queryByRole('img');

    expect(swatch).not.toBeInTheDocument();
  });
});
