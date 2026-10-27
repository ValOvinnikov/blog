import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Prose } from './prose';

faker.seed(123);

const MOCK_BODY = faker.lorem.paragraph();

const setup = customRender(Prose, {
  children: MOCK_BODY,
});

describe(`<${Prose.name}/>`, () => {
  it('renders children', () => {
    setup();

    const body = screen.getByText(MOCK_BODY);

    expect(body).toBeVisible();
  });
});
