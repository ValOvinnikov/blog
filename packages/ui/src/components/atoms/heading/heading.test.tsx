import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Heading } from './heading';

faker.seed(123);

const MOCK_TITLE = faker.lorem.words(2);

const setup = customRender(Heading, {
  level: 1,
  children: MOCK_TITLE,
});

describe(`<${Heading.name}/>`, () => {
  it.each([1, 2, 3, 4] as const)('renders a level %s heading', (level) => {
    setup({ level });

    const heading = screen.getByRole('heading', { level, name: MOCK_TITLE });

    expect(heading).toBeVisible();
  });
});
