import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GuardedLink } from './guarded-link';

vi.mock('@platform/i18n/base-navigation');

describe(GuardedLink, () => {
  it('renders a link to href', () => {
    render(<GuardedLink href="/tenants">Tenants</GuardedLink>);

    expect(screen.getByRole('link', { name: 'Tenants' })).toHaveAttribute(
      'href',
      '/tenants',
    );
  });

  it("still calls the caller's onNavigate outside an unsaved-changes guard", async () => {
    const onNavigate = vi.fn();
    render(
      <GuardedLink href="/tenants" onNavigate={onNavigate}>
        Tenants
      </GuardedLink>,
    );

    await userEvent.click(screen.getByRole('link', { name: 'Tenants' }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
