import { render, screen } from '@admin/testing/custom-render';

import { StatusBadge } from './status-badge';

describe(StatusBadge, () => {
  it('renders its label', () => {
    render(<StatusBadge tone="ok">Active</StatusBadge>);
    expect(screen.getByText('Active')).toBeVisible();
  });

  it('carries the tone in its classes so the dot inherits it', () => {
    const { container } = render(<StatusBadge tone="bad">Failed</StatusBadge>);
    expect(container.firstChild).toHaveClass('text-admin-bad');
  });

  it('defaults to the neutral tone', () => {
    const { container } = render(<StatusBadge>Draft</StatusBadge>);
    expect(container.firstChild).toHaveClass('text-admin-muted');
  });
});
