import { render, screen } from '@admin/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { Button } from './button';

describe(Button, () => {
  it('renders its children', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  it('defaults to the secondary variant and md size', () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('bg-admin-surface');
    expect(button).toHaveClass('text-[13px]');
  });

  it('honours the primary variant', () => {
    render(<Button variant="primary">Create tenant</Button>);

    expect(screen.getByRole('button', { name: 'Create tenant' })).toHaveClass(
      'bg-admin-brand',
    );
  });

  it('honours the ghost variant', () => {
    render(<Button variant="ghost">Dismiss</Button>);

    expect(screen.getByRole('button', { name: 'Dismiss' })).toHaveClass(
      'bg-transparent',
    );
  });

  it('honours the danger variant', () => {
    render(<Button variant="danger">Deprovision</Button>);

    expect(screen.getByRole('button', { name: 'Deprovision' })).toHaveClass(
      'text-admin-bad',
    );
  });

  it('honours the sm size', () => {
    render(<Button size="sm">Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass(
      'text-[12px]',
    );
  });

  it('renders disabled with the locked-state classes and blocks the click handler', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button isDisabled={true} onClick={handleClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:cursor-not-allowed');
    expect(button).toHaveClass('disabled:opacity-[.45]');
    expect(button).toHaveClass('disabled:pointer-events-none');

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('calls onClick when enabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Save</Button>);

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
