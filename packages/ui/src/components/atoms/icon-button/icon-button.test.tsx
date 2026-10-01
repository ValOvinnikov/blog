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

  it('forwards disabled attribute', () => {
    setup({ ariaLabel: 'Toggle theme', isDisabled: true, children: <span /> });
    expect(screen.getByRole('button', { name: 'Toggle theme' })).toBeDisabled();
  });

  it('renders aria-disabled instead of disabled when isFocusableWhenDisabled is set, and stays focusable', () => {
    setup({
      ariaLabel: 'Toggle theme',
      isDisabled: true,
      isFocusableWhenDisabled: true,
      children: <span />,
    });

    const button = screen.getByRole('button', { name: 'Toggle theme' });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');

    button.focus();
    expect(button).toHaveFocus();
  });

  it('does not call onClick when aria-disabled', async () => {
    const onClick = vi.fn();
    setup({
      ariaLabel: 'Toggle theme',
      isDisabled: true,
      isFocusableWhenDisabled: true,
      onClick,
      children: <span />,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Toggle theme' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
