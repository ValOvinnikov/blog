import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { ActionList } from './action-list';

faker.seed(123);

const label = faker.lorem.words(2);

const setup = customRender(ActionList, {
  children: <button>{label}</button>,
});

describe(`<${ActionList.name}/>`, () => {
  it('renders children', () => {
    setup();
    expect(screen.getByRole('button', { name: label })).toBeVisible();
  });

  it('forwards dataTestId', () => {
    setup({ dataTestId: 'action-list' });
    expect(screen.getByTestId('action-list')).toBeVisible();
  });
});
