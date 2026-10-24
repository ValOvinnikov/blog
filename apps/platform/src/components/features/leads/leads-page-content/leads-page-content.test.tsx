import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockLead } from '@platform/testing/leads/fixtures';
import {
  mockReadyTenant,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import userEvent from '@testing-library/user-event';

import { LeadsPageContent } from './leads-page-content';

const { listLeadsByCursorMock, setLeadReadActionMock } = vi.hoisted(() => ({
  listLeadsByCursorMock: vi.fn(),
  setLeadReadActionMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { leads: { listLeadsByCursor: listLeadsByCursorMock } },
}));

vi.mock('@platform/server/leads/delete-lead-action', () => ({
  deleteLeadAction: vi.fn(),
}));

vi.mock('@platform/server/leads/load-more-leads-action', () => ({
  loadMoreLeadsAction: vi.fn(),
}));

vi.mock('@platform/server/leads/get-lead-page-title-action', () => ({
  getLeadPageTitleAction: vi.fn(),
}));

vi.mock('@platform/server/leads/set-lead-read-action', () => ({
  setLeadReadAction: setLeadReadActionMock,
}));

const setup = customRenderAsync(LeadsPageContent, {
  tenant: mockReadyTenant({ id: MOCK_TENANT_ID, plan: TENANT_PLAN.GROWTH }),
});

const CONTACT_FORM_NOT_INCLUDED_IN = 'Contact form not included in your plan';
const ADA_LOVELACE = 'Ada Lovelace';

describe(LeadsPageContent, () => {
  beforeEach(() => {
    setLeadReadActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    listLeadsByCursorMock.mockReset();
    listLeadsByCursorMock.mockResolvedValue({
      leads: [],
      nextCursor: undefined,
    });
  });

  it("asks for the first page of the tenant's own leads", async () => {
    await setup();

    expect(listLeadsByCursorMock).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
    });
  });

  it('lists the leads newest first, as returned', async () => {
    listLeadsByCursorMock.mockResolvedValue({
      leads: [
        mockLead({ id: 'lead-2', name: 'Newest' }),
        mockLead({ id: 'lead-1', name: 'Oldest' }),
      ],
      nextCursor: undefined,
    });

    await setup();

    const [newest, oldest] = screen.getAllByRole('listitem');
    expect(newest).toHaveTextContent('Newest');
    expect(oldest).toHaveTextContent('Oldest');
  });

  it('says so when there are no messages yet', async () => {
    await setup();

    expect(screen.getByText(/No messages yet/)).toBeVisible();
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

  it('keeps the leads deletable and warns when the plan no longer includes the contact form', async () => {
    listLeadsByCursorMock.mockResolvedValue({
      leads: [mockLead({ name: ADA_LOVELACE })],
      nextCursor: undefined,
    });

    await setup({
      tenant: mockReadyTenant({ id: MOCK_TENANT_ID, plan: TENANT_PLAN.FREE }),
    });
    await userEvent.click(screen.getByRole('button', { name: /Ada Lovelace/ }));

    expect(screen.getByText(CONTACT_FORM_NOT_INCLUDED_IN)).toBeVisible();
    expect(
      screen.getByText(/messages you already received are kept/),
    ).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: 'Delete the message from Ada Lovelace',
      }),
    ).toBeVisible();
  });
});
