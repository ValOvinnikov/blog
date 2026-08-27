import { render, screen } from '@admin/testing/custom-render';

import { ToastViewport } from './toast-viewport';

describe(ToastViewport, () => {
  it('renders a labelled region', () => {
    render(<ToastViewport ariaLabel="Notifications" />);
    expect(screen.getByRole('region', { name: 'Notifications' })).toBeVisible();
  });

  it('renders children in the order given', () => {
    render(
      <ToastViewport ariaLabel="Notifications">
        <span>first</span>
        <span>second</span>
      </ToastViewport>,
    );

    const region = screen.getByRole('region', { name: 'Notifications' });
    expect(region.textContent).toBe('firstsecond');
  });
});
