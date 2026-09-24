import { customRender, screen } from '@blog/ui/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { BackToTop } from './back-to-top';

const setup = customRender(BackToTop, {
  isVisible: true,
  onClick: vi.fn(),
  ariaLabel: 'Back to top',
});

describe(`<${BackToTop.name}/>`, () => {
  it('renders with the given accessible name', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Back to top' })).toBeVisible();
  });

  it('is visible and not inert when isVisible is true', () => {
    setup();
    const button = screen.getByRole('button', { name: 'Back to top' });
    expect(button).toBeVisible();
    expect(button).not.toHaveAttribute('inert');
  });

  it('is inert when isVisible is false', () => {
    setup({ isVisible: false });
    const button = screen.getByRole('button', {
      hidden: true,
      name: 'Back to top',
    });
    expect(button).toHaveAttribute('inert');
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    setup({ onClick });
    await userEvent.click(screen.getByRole('button', { name: 'Back to top' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
