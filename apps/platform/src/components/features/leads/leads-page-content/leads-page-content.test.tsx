import { TENANT_PLAN } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import {
  customRenderAsync,
  screen,
  within,
} from '@platform/testing/custom-render';
import { mockLead } from '@platform/testing/leads/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';

import { LeadsPageContent } from './leads-page-content';

faker.seed(5757);

const { listLeadsByCursorMock } = vi.hoisted(() => ({
  listLeadsByCursorMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { leads: { listLeadsByCursor: listLeadsByCursorMock } },
}));

vi.mock('@platform/server/leads/delete-lead-action');

vi.mock('@platform/server/leads/load-more-leads-action');

vi.mock('@platform/server/leads/get-lead-page-title-action');

vi.mock('@platform/server/leads/set-lead-read-action');

const MOCK_NEWEST_LEAD = mockLead({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
});
const MOCK_OLDEST_LEAD = mockLead({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
});
const CONTACT_FORM_NOT_INCLUDED = 'Contact form not included in your plan';

const setup = customRenderAsync(LeadsPageContent, {
  tenant: mockReadyTenant({ id: MOCK_TENANT_ID, plan: TENANT_PLAN.GROWTH }),
});

describe(`<${LeadsPageContent.name}/>`, () => {
  beforeEach(() => {
    listLeadsByCursorMock.mockResolvedValue({
      leads: [],
      nextCursor: undefined,
    });
  });

  describe('with no leads', () => {
    beforeEach(async () => {
      await setup();
    });

    it("asks for the first page of the tenant's own leads", () => {
      expect(listLeadsByCursorMock).toHaveBeenCalledWith({
        tenantId: MOCK_TENANT_ID,
      });
    });

    it('says so when there are no messages yet', () => {
      const emptyState = screen.getByText(/No messages yet/);

      expect(emptyState).toBeVisible();
    });

    it('states that each message was also emailed', () => {
      const description = screen.getByText(/also emailed to you/);

      expect(description).toBeVisible();
    });

    it('shows no plan notice while the plan includes the contact form', () => {
      const planNotice = screen.queryByText(CONTACT_FORM_NOT_INCLUDED);

      expect(planNotice).not.toBeInTheDocument();
    });
  });

  it('lists the leads newest first, as returned', async () => {
    listLeadsByCursorMock.mockResolvedValue({
      leads: [MOCK_NEWEST_LEAD, MOCK_OLDEST_LEAD],
      nextCursor: undefined,
    });

    await setup();

    const list = screen.getByRole('list', { name: 'Messages' });
    const [newest, oldest] = within(list).getAllByRole('listitem');

    expect(newest).toHaveTextContent(MOCK_NEWEST_LEAD.name);
    expect(oldest).toHaveTextContent(MOCK_OLDEST_LEAD.name);
  });

  it('keeps the leads and warns when the plan no longer has the contact form', async () => {
    listLeadsByCursorMock.mockResolvedValue({
      leads: [MOCK_NEWEST_LEAD],
      nextCursor: undefined,
    });

    await setup({
      tenant: mockReadyTenant({ id: MOCK_TENANT_ID, plan: TENANT_PLAN.FREE }),
    });

    const planNotice = screen.getByText(CONTACT_FORM_NOT_INCLUDED);
    const keptNotice = screen.getByText(
      /messages you already received are kept/,
    );
    const leadRow = screen.getByRole('button', {
      name: new RegExp(MOCK_NEWEST_LEAD.name),
    });

    expect(planNotice).toBeVisible();
    expect(keptNotice).toBeVisible();
    expect(leadRow).toBeVisible();
  });
});
