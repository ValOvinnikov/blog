import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { RailIntro } from './rail-intro';

faker.seed(6271);

const MOCK_TITLE = faker.lorem.words(3);
const MOCK_DESCRIPTION = faker.lorem.sentence();

const setup = customRender(RailIntro, {
  title: MOCK_TITLE,
  description: MOCK_DESCRIPTION,
});

describe(`<${RailIntro.name}/>`, () => {
  it('shows the title and description without claiming a heading', () => {
    setup();

    const title = screen.getByText(MOCK_TITLE);
    const description = screen.getByText(MOCK_DESCRIPTION);
    const heading = screen.queryByRole('heading');

    expect(title).toBeVisible();
    expect(description).toBeVisible();
    expect(heading).not.toBeInTheDocument();
  });

  it('names the page with its title when it is the page heading', () => {
    setup({ isPageHeading: true });

    const heading = screen.getByRole('heading', { level: 1, name: MOCK_TITLE });

    expect(heading).toBeVisible();
  });
});
