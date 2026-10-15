import { customRender, screen, within } from '@platform/testing/custom-render';
import { makeLead } from '@platform/testing/leads/fixtures';
import { toLeadRow } from '@platform/utils/lead-row/lead-row';
import userEvent from '@testing-library/user-event';

import { LeadsTable } from './leads-table';

vi.mock('@platform/server/leads/delete-lead-action', () => ({
  deleteLeadAction: vi.fn(),
}));

const setup = customRender(LeadsTable, {
  tenantId: 'tenant-1',
  leads: [toLeadRow(makeLead())],
});

describe(`<${LeadsTable.name}/>`, () => {
  it('shows the empty state for a tenant with no leads', () => {
    setup({ leads: [] });

    expect(screen.getByText(/No messages yet/)).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('lists the leads in the order given, one row each, under the page title', () => {
    setup({
      leads: [
        toLeadRow(makeLead({ id: 'lead-2', name: 'Newest' })),
        toLeadRow(makeLead({ id: 'lead-1', name: 'Oldest' })),
      ],
    });

    const [, ...rows] = screen.getAllByRole('row');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText('Newest')).toBeVisible();
    expect(within(rows[1]!).getByText('Oldest')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Leads' })).toContainElement(
      screen.getByRole('table'),
    );
  });

  it('shows when the message was received, its sender and the page it came from', () => {
    setup();

    expect(screen.getByText(/Apr 2, 2026/)).toHaveAttribute(
      'dateTime',
      '2026-04-02T09:30:00.000Z',
    );
    expect(screen.getByText('Ada Lovelace')).toBeVisible();
    expect(screen.getByText('/contact')).toBeVisible();
  });

  it('links the email address with mailto', () => {
    setup();

    expect(
      screen.getByRole('link', { name: 'ada@example.com' }),
    ).toHaveAttribute('href', 'mailto:ada@example.com');
  });

  it('expands and collapses a message', async () => {
    setup();
    const toggle = screen.getByRole('button', { name: 'Show more' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await userEvent.setup().click(toggle);

    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('offers a delete per row, named after the sender', () => {
    setup();

    expect(
      screen.getByRole('button', {
        name: 'Delete the message from Ada Lovelace',
      }),
    ).toBeVisible();
  });
});
