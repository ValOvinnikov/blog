import { faker } from '@faker-js/faker';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';

import { Caption } from './caption';

faker.seed(123);

const MOCK_CAPTION = faker.lorem.sentence();

const setup = customRender(Caption, {});

describe(`<${Caption.name}/>`, () => {
  it('renders children', () => {
    setup({ children: MOCK_CAPTION });

    const caption = screen.getByText(MOCK_CAPTION);

    expect(caption).toBeVisible();
  });
});
