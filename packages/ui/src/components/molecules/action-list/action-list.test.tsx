import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { ActionList } from './action-list';

faker.seed(123);

const MOCK_LABEL = faker.lorem.words(2);

const setup = customRender(ActionList, {
  children: <button>{MOCK_LABEL}</button>,
});

describe(`<${ActionList.name}/>`, () => {
  it('renders children', () => {
    setup();

    const button = screen.getByRole('button', { name: MOCK_LABEL });

    expect(button).toBeVisible();
  });
});
