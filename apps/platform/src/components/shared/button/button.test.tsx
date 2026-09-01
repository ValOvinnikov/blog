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
});
