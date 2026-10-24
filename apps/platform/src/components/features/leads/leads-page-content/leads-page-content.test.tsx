import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { LEADS_PAGE_SIZE, TENANT_PLAN } from '@blog/db/constants';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockLead } from '@platform/testing/leads/fixtures';
import {
  mockReadyTenant,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
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
  tenant: mockReadyTenant({ id: MOCK_TENANT_ID, plan: TENANT_PLAN.GROWTH }),
  page: 1,
  pageHref: adminRoutes.dashboardLeads,
});

const CONTACT_FORM_NOT_INCLUDED_IN = 'Contact form not included in your plan';
const ADA_LOVELACE = 'Ada Lovelace';

describe(LeadsPageContent, () => {
  beforeEach(() => {
    listLeadsMock.mockReset();
    listLeadsMock.mockResolvedValue({ leads: [], total: 0 });
  });

  it("asks for the requested page of the tenant's own leads, a page at a time", async () => {
    listLeadsMock.mockResolvedValue({ leads: [mockLead()], total: 60 });

    await setup({ page: 2 });

    expect(listLeadsMock).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
      page: 2,
      pageSize: LEADS_PAGE_SIZE,
    });
  });

  it('renders the leads newest first, as returned, with the page position', async () => {
    listLeadsMock.mockResolvedValue({
      leads: [
        mockLead({ id: 'lead-2', name: 'Newest' }),
        mockLead({ id: 'lead-1', name: 'Oldest' }),
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
      screen.queryByText(CONTACT_FORM_NOT_INCLUDED_IN),
    ).not.toBeInTheDocument();
  });

  it('keeps the leads and warns when the plan no longer includes the contact form', async () => {
    listLeadsMock.mockResolvedValue({
      leads: [mockLead({ name: ADA_LOVELACE })],
      total: 1,
    });

    await setup({
      tenant: mockReadyTenant({ id: MOCK_TENANT_ID, plan: TENANT_PLAN.FREE }),
    });

    expect(screen.getByText(CONTACT_FORM_NOT_INCLUDED_IN)).toBeVisible();
    expect(
      screen.getByText(/messages you already received are kept/),
    ).toBeVisible();
    expect(screen.getByText(ADA_LOVELACE)).toBeVisible();
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
        pageHref: (page) => `/tenants/${MOCK_TENANT_ID}/leads?page=${page}`,
      }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(
      `/tenants/${MOCK_TENANT_ID}/leads?page=2`,
    );
  });

  it('sends a page past the end to the last page', async () => {
    listLeadsMock.mockResolvedValue({ leads: [], total: 30 });

    await expect(setup({ page: 9 })).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith('/dashboard/leads?page=2');
  });

  it('sends a page past the end of an empty list to the first page', async () => {
    await expect(setup({ page: 3 })).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith('/dashboard/leads');
  });
});
