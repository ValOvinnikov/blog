import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Button } from './button';

faker.seed(123);

const MOCK_LABEL = faker.lorem.words(2);

const setup = customRender(Button, { children: MOCK_LABEL });

describe(`<${Button.name}/>`, () => {
  it('renders a button named by its children', () => {
    setup();

    const button = screen.getByRole('button', { name: MOCK_LABEL });

    expect(button).toBeVisible();
  });

  it('is disabled when isDisabled is set', () => {
    setup({ isDisabled: true });

    const button = screen.getByRole('button', { name: MOCK_LABEL });

    expect(button).toBeDisabled();
  });
});
