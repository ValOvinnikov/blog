import { render, screen } from '@admin/testing/custom-render';
import { Size } from '@blog/config';
import userEvent from '@testing-library/user-event';

import { Button } from './button';

describe(Button, () => {
  it('renders its children', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  it('renders every variant and size without throwing', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger'] as const;
    const sizes = [Size.SM, Size.MD] as const;

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
});
