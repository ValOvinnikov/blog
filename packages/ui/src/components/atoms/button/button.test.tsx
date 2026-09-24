import { customRender, screen } from '@blog/ui/testing/custom-render';

import { Button } from './button';

const setup = customRender(Button, { children: 'Click me' });

describe(`<${Button.name}/>`, () => {
  it('renders a button element', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Click me' })).toBeVisible();
  });

  it('forwards disabled attribute', () => {
    setup({ isDisabled: true, children: 'Disabled' });
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });
});
