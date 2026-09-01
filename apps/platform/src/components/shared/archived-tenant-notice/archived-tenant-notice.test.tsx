import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { ArchivedTenantNotice } from './archived-tenant-notice';

describe(ArchivedTenantNotice, () => {
  it('renders a status-role notice naming the archive date', () => {
    renderWithIntl(
      <ArchivedTenantNotice
        archivedAt={new Date('2026-08-26T00:00:00.000Z')}
      />,
    );

    expect(screen.getByRole('status')).toBeVisible();
    expect(screen.getByText('This tenant is archived')).toBeVisible();
    expect(screen.getByText(/Aug 26, 2026/)).toBeVisible();
  });

  it('forwards an id, so a disabled control elsewhere can reference it via aria-describedby', () => {
    renderWithIntl(
      <ArchivedTenantNotice
        id="archived-notice"
        archivedAt={new Date('2026-08-26T00:00:00.000Z')}
      />,
    );

    expect(screen.getByRole('status')).toHaveAttribute('id', 'archived-notice');
  });
});
