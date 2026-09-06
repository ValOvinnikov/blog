import { SIZE } from '@blog/config';
import { render, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { Button } from './button';

describe(Button, () => {
  it('renders its children', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  it('renders every variant and size without throwing', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger'] as const;
    const sizes = [SIZE.SM, SIZE.MD] as const;

    variants.forEach((variant) => {
      sizes.forEach((size) => {
        expect(() =>
          render(
            <Button variant={variant} size={size}>
              Save
            </Button>,
          ),
        ).not.toThrow();
      });
    });
  });

  it('renders disabled and blocks the click handler', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button isDisabled={true} onClick={handleClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();

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

  it('keeps a decorative arrow out of the accessible name', () => {
    render(<Button hasArrow={true}>Begin provisioning</Button>);

    expect(
      screen.getByRole('button', { name: 'Begin provisioning' }),
    ).toBeInTheDocument();
  });

  it('associates a description via aria-describedby, so a disabled control can be explained by an element elsewhere on the page', () => {
    render(
      <>
        <Button isDisabled={true} aria-describedby="save-reason">
          Save
        </Button>
        <p id="save-reason">This tenant is archived.</p>
      </>,
    );

    expect(
      screen.getByRole('button', { name: 'Save' }),
    ).toHaveAccessibleDescription('This tenant is archived.');
  });

  it('disables the button and sets aria-busy while pending', () => {
    render(<Button isPending={true}>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('blocks the click handler while pending, even without isDisabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button isPending={true} onClick={handleClick}>
        Save
      </Button>,
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not set aria-busy or disable the button when not pending', () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('aria-busy', 'false');
  });

  it('shows pendingLabel as the button label in place of children while pending', () => {
    render(
      <Button isPending={true} pendingLabel="Saving…">
        Save
      </Button>,
    );

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
  });

  it('mounts a persistent, polite status region as soon as pendingLabel is given, even when not pending, with no announcement text yet', () => {
    render(<Button pendingLabel="Saving…">Save</Button>);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('');
  });

  it('renders no status region at all, even while pending, when no pendingLabel is given', () => {
    render(<Button isPending={true}>Save</Button>);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it("announces pendingLabel by updating the persistent status region's own text in place, rather than inserting a new element already populated", () => {
    const { rerender } = render(
      <Button isPending={false} pendingLabel="Saving…">
        Save
      </Button>,
    );

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('');

    rerender(
      <Button isPending={true} pendingLabel="Saving…">
        Save
      </Button>,
    );

    // A screen reader only announces a change within a region that already
    // existed — the same node must update, not get replaced by a fresh one.
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toHaveTextContent('Saving…');
  });
});
