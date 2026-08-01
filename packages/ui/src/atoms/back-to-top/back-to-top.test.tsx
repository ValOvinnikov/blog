import { customRender, screen } from '@blog/ui/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { BackToTop } from './back-to-top';

const setup = customRender(BackToTop, {
  visible: true,
  onClick: vi.fn(),
  ariaLabel: 'Back to top',
});

describe(`<${BackToTop.name}/>`, () => {
  it('renders with the given accessible name', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Back to top' })).toBeVisible();
  });

  it('is visible and focusable when visible is true', () => {
    setup();
    const button = screen.getByRole('button', { name: 'Back to top' });
    expect(button).toBeVisible();
    expect(button).not.toHaveAttribute('tabindex', '-1');
  });

  it('is removed from the accessibility tree when visible is false', () => {
    setup({ visible: false });
    expect(
      screen.queryByRole('button', { name: 'Back to top' }),
    ).not.toBeInTheDocument();
  });

  it('is not focusable when visible is false', () => {
    setup({ visible: false });
    const button = screen.getByRole('button', { hidden: true });
    expect(button).toHaveAttribute('tabindex', '-1');
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    setup({ onClick });
    await userEvent.click(screen.getByRole('button', { name: 'Back to top' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
