import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { DeadEndView } from './dead-end-view';

faker.seed(2404);

const MOCK_TITLE = faker.lorem.words(3);
const MOCK_DESCRIPTION = faker.lorem.sentence();
const MOCK_ACTION_LABEL = faker.lorem.words(2);

const setup = customRender(DeadEndView, {
  title: MOCK_TITLE,
  description: MOCK_DESCRIPTION,
  action: <button type="button">{MOCK_ACTION_LABEL}</button>,
});

describe(`<${DeadEndView.name}/>`, () => {
  it('renders the title as the page heading with its description and action', () => {
    setup();

    const heading = screen.getByRole('heading', { level: 1, name: MOCK_TITLE });
    const description = screen.getByText(MOCK_DESCRIPTION);
    const action = screen.getByRole('button', { name: MOCK_ACTION_LABEL });

    expect(heading).toBeVisible();
    expect(description).toBeVisible();
    expect(action).toBeVisible();
  });
});
