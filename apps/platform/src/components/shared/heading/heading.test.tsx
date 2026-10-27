import { faker } from '@faker-js/faker';
import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { Heading } from './heading';

faker.seed(5995);

const MOCK_HEADING = faker.lorem.words(2);

describe(`<${Heading.name}/>`, () => {
  it.each([1, 2, 3, 4] as const)('renders a semantic h%i', (level) => {
    renderWithIntl(
      <Heading level={level} size="cardTitle">
        {MOCK_HEADING}
      </Heading>,
    );

    const heading = screen.getByRole('heading', { level, name: MOCK_HEADING });

    expect(heading).toBeVisible();
  });
});
