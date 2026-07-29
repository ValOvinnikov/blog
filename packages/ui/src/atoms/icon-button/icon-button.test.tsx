import { customRender, screen } from '@blog/ui/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { IconButton } from './icon-button';

const setup = customRender(IconButton, {
  ariaLabel: 'Toggle theme',
  children: <span>icon</span>,
});

describe(`<${IconButton.name}/>`, () => {
  it('renders as a button with aria-label', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Toggle theme' })).toBeVisible();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    setup({ ariaLabel: 'click', onClick, children: <span /> });
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows a pointer cursor on hover', () => {
    setup();
    expect(
      screen.getByRole('button', { name: 'Toggle theme' }).className,
    ).toContain('cursor-pointer');
  });

  it('disables pointer events (and thus the pointer cursor) when disabled', () => {
    setup({ ariaLabel: 'Toggle theme', disabled: true, children: <span /> });
    expect(
      screen.getByRole('button', { name: 'Toggle theme' }).className,
    ).toContain('disabled:pointer-events-none');
  });
});
