import { LeadsTenantProvider } from '@platform/components/features/leads/leads-tenant-provider';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import { mockLead } from '@platform/testing/leads/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import type { ComponentProps } from 'react';

import { LeadsTable } from './leads-table';

vi.mock('@platform/server/leads/delete-lead-action', () => ({
  deleteLeadAction: vi.fn(),
}));

const setup = (props: Partial<ComponentProps<typeof LeadsTable>> = {}) =>
  renderWithIntl(
    <LeadsTenantProvider tenantId={MOCK_TENANT_ID}>
      <LeadsTable leads={[mockLead()]} {...props} />
    </LeadsTenantProvider>,
  );

describe(`<${LeadsTable.name}/>`, () => {
  it('shows the empty state for a tenant with no leads', () => {
    setup({ leads: [] });

    const emptyState = screen.getByText(/No messages yet/);
    const table = screen.queryByRole('table');
    expect(emptyState).toBeVisible();
    expect(table).not.toBeInTheDocument();
  });

  it('lists the leads in the order given, one row each, under the page title', () => {
    setup({
      leads: [
        mockLead({ id: 'lead-2', name: 'Newest' }),
        mockLead({ id: 'lead-1', name: 'Oldest' }),
      ],
    });

    const [, ...rows] = screen.getAllByRole('row');
    const newest = within(rows[0]!).getByText('Newest');
    const oldest = within(rows[1]!).getByText('Oldest');
    const region = screen.getByRole('region', { name: 'Leads' });
    const table = screen.getByRole('table');
    expect(rows).toHaveLength(2);
    expect(newest).toBeVisible();
    expect(oldest).toBeVisible();
    expect(region).toContainElement(table);
  });

  it('shows when the message was received, its sender and the page it came from', () => {
    setup();

    const received = screen.getByText(/Apr 2, 2026/);
    const sender = screen.getByText('Ada Lovelace');
    const sourcePage = screen.getByText('/contact');
    expect(received).toHaveAttribute('dateTime', '2026-04-02T09:30:00.000Z');
    expect(sender).toBeVisible();
    expect(sourcePage).toBeVisible();
  });

  it('names the home page instead of its bare path', () => {
    setup({ leads: [mockLead({ sourcePath: '/' })] });

    const sourcePage = screen.getByText('Home page');
    expect(sourcePage).toBeVisible();
  });

  it('links the email address with mailto', () => {
    setup();

    const emailLink = screen.getByRole('link', { name: 'ada@example.com' });
    expect(emailLink).toHaveAttribute('href', 'mailto:ada@example.com');
  });

  it('offers a delete per row, named after the sender', () => {
    setup();

    const deleteButton = screen.getByRole('button', {
      name: 'Delete the message from Ada Lovelace',
    });
    expect(deleteButton).toBeVisible();
  });
});
