import { TENANT_PLAN } from '@blog/db/constants';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeLead } from '@platform/testing/leads/fixtures';
import { makeReadyTenant } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';

import { LeadsPageContent } from './leads-page-content';

const { listLeadsMock } = vi.hoisted(() => ({ listLeadsMock: vi.fn() }));

vi.mock('@blog/db', () => ({
  queries: { leads: { listLeads: listLeadsMock } },
}));

vi.mock('@platform/server/leads/delete-lead-action', () => ({
  deleteLeadAction: vi.fn(),
}));

const setup = customRenderAsync(LeadsPageContent, {
  tenant: makeReadyTenant({ id: 'tenant-1', plan: TENANT_PLAN.GROWTH }),
  page: 1,
  pageHref: adminRoutes.dashboardLeads,
});

describe(LeadsPageContent, () => {
  beforeEach(() => {
    listLeadsMock.mockReset();
    listLeadsMock.mockResolvedValue({ leads: [], total: 0 });
  });

  it("asks for the requested page of the tenant's own leads, 25 at a time", async () => {
    listLeadsMock.mockResolvedValue({ leads: [makeLead()], total: 60 });

    await setup({ page: 2 });

    expect(listLeadsMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      pageSize: 25,
    });
  });

  it('renders the leads newest first, as returned, with the page position', async () => {
    listLeadsMock.mockResolvedValue({
      leads: [
        makeLead({ id: 'lead-2', name: 'Newest' }),
        makeLead({ id: 'lead-1', name: 'Oldest' }),
      ],
      total: 30,
    });

    await setup();

    const [, newest, oldest] = screen.getAllByRole('row');
    expect(newest).toHaveTextContent('Newest');
    expect(oldest).toHaveTextContent('Oldest');
    expect(screen.getByText('Page 1 of 2')).toBeVisible();
  });

  it('states that each message was also emailed', async () => {
    await setup();

    expect(screen.getByText(/also emailed to you/)).toBeVisible();
  });

  it('shows no plan notice while the plan includes the contact form', async () => {
    await setup();

    expect(
      screen.queryByText('Contact form not included in your plan'),
    ).not.toBeInTheDocument();
  });

  it('keeps the leads and warns when the plan no longer includes the contact form', async () => {
    listLeadsMock.mockResolvedValue({
      leads: [makeLead({ name: 'Ada Lovelace' })],
      total: 1,
    });

    await setup({
      tenant: makeReadyTenant({ id: 'tenant-1', plan: TENANT_PLAN.FREE }),
    });

    expect(
      screen.getByText('Contact form not included in your plan'),
    ).toBeVisible();
    expect(
      screen.getByText(/messages you already received are kept/),
    ).toBeVisible();
    expect(screen.getByText('Ada Lovelace')).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: 'Delete the message from Ada Lovelace',
      }),
    ).toBeVisible();
  });

  it('redirects within the address space the caller gives', async () => {
    listLeadsMock.mockResolvedValue({ leads: [], total: 30 });

    await expect(
      setup({
        page: 9,
        pageHref: (page) => `/tenants/tenant-1/leads?page=${page}`,
      }),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/tenants/tenant-1/leads?page=2');
  });

  it('shows the empty state for a tenant with no leads', async () => {
    await setup();

    expect(screen.getByText(/No messages yet/)).toBeVisible();
  });

  it('sends a page past the end to the last page', async () => {
    listLeadsMock.mockResolvedValue({ leads: [], total: 30 });

    await expect(setup({ page: 9 })).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/dashboard/leads?page=2');
  });

  it('sends a page past the end of an empty list to the first page', async () => {
    await expect(setup({ page: 3 })).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/dashboard/leads');
  });
});
