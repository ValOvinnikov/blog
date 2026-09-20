import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { InlineCode } from './inline-code';

faker.seed(123);

const setup = customRender(InlineCode, {
  children: faker.hacker.noun(),
});

describe(`<${InlineCode.name}/>`, () => {
  it('renders a code element', () => {
    const token = faker.hacker.noun();
    setup({ children: token });
    expect(screen.getByText(token).tagName).toBe('CODE');
  });

  it('forwards dataTestId as a data-testid attribute', () => {
    setup({ children: 'token', dataTestId: 'inline-code' });
    expect(screen.getByTestId('inline-code')).toBeVisible();
  });
});
