import { BRAND_VARIANT } from '@blog/config';
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

  it('keeps the focus ring on brand-primary for a control x brand-primary tone, not the low-contrast contrast token', () => {
    setup({
      ariaLabel: 'Next slide',
      variant: 'control',
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      children: <span />,
    });
    const button = screen.getByRole('button', { name: 'Next slide' });
    expect(button).toHaveClass('focus-visible:ring-brand-primary');
    expect(button).not.toHaveClass('focus-visible:ring-brand-primary-contrast');
  });

  it('keeps the base 50% fade for a disabled control, with no outline swap', () => {
    setup({
      ariaLabel: 'Next slide',
      variant: 'control',
      isDisabled: true,
      children: <span />,
    });
    const button = screen.getByRole('button', { name: 'Next slide' });
    expect(button).toHaveClass('disabled:opacity-50');
    expect(button).not.toHaveClass('disabled:border-border-strong');
    expect(button).not.toHaveClass('disabled:opacity-100');
  });

  it('keeps the brand ring and chevron on hover for the control variant', () => {
    setup({
      ariaLabel: 'Next slide',
      variant: 'control',
      children: <span />,
    });
    const button = screen.getByRole('button', { name: 'Next slide' });
    expect(button).toHaveClass(
      'hover:border-brand-primary',
      'hover:text-brand-primary',
      'hover:bg-brand-primary-muted',
    );
    expect(button).not.toHaveClass('hover:border-border-emphasis');
    expect(button).not.toHaveClass('hover:text-text');
  });

  it('matches the hover ring to the solid fill for control x brand-primary', () => {
    setup({
      ariaLabel: 'Next slide',
      variant: 'control',
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      children: <span />,
    });
    const button = screen.getByRole('button', { name: 'Next slide' });
    expect(button).toHaveClass(
      'hover:border-brand-primary-solid',
      'hover:bg-brand-primary-solid',
      'hover:text-brand-primary-contrast',
    );
    expect(button).not.toHaveClass('hover:border-border-emphasis');
  });

  it('keeps the base 50% fade for the default variant when disabled', () => {
    setup({ ariaLabel: 'Toggle theme', isDisabled: true, children: <span /> });
    const button = screen.getByRole('button', { name: 'Toggle theme' });
    expect(button).toHaveClass('disabled:opacity-50');
  });
});
