import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';

import TenantDetailLayout from './layout';

faker.seed(6302);

const {
  getAdminByUserIdMock,
  getTenantByIdMock,
  countUnreadLeadsForTenantMock,
} = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  countUnreadLeadsForTenantMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: vi.fn() })),
  headers: vi.fn(async () => new Headers()),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
    leads: { countUnreadLeadsForTenant: countUnreadLeadsForTenantMock },
  },
}));

const { navSections } = messages;
const t = makeEnTranslator('navSections');

const MOCK_TENANT_CONTENT = faker.lorem.sentence();
const MOCK_UNREAD_LEADS_COUNT = faker.number.int({ min: 2, max: 9 });

const setup = customRenderAsync(TenantDetailLayout, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
  children: <div>{MOCK_TENANT_CONTENT}</div>,
});

describe(`<${TenantDetailLayout.name}/>`, () => {
  beforeEach(() => {
    getAdminByUserIdMock.mockResolvedValue(mockAdmin());
    getTenantByIdMock.mockResolvedValue(mockReadyTenant());
    countUnreadLeadsForTenantMock.mockResolvedValue(0);
  });

  describe('for a platform operator', () => {
    beforeEach(async () => {
      await setup();
    });

    it('renders the gated content', () => {
      const content = screen.getByText(MOCK_TENANT_CONTENT);

      expect(content).toBeVisible();
    });

    it('renders both the Platform and Tenant sections in the sidebar', () => {
      const platformSection = screen.getByText(navSections.platformLabel, {
        selector: 'p',
      });
      const tenantSection = screen.getByText(
        t('tenantLabel', { tenantName: MOCK_TENANT_NAME }),
      );

      expect(platformSection).toBeVisible();
      expect(tenantSection).toBeVisible();
    });

    it('renders no tenant switcher in the sidebar', () => {
      const tenantDomain = screen.queryByText(MOCK_TENANT_DOMAIN);

      expect(tenantDomain).not.toBeInTheDocument();
    });
  });

  it("shows the tenant's unread lead count beside Leads", async () => {
    countUnreadLeadsForTenantMock.mockResolvedValueOnce(
      MOCK_UNREAD_LEADS_COUNT,
    );

    await setup();

    const leadsLink = screen.getByRole('link', {
      name: new RegExp(navSections.leads),
    });

    expect(leadsLink).toHaveTextContent(
      t('badgeUnreadLeads', { count: MOCK_UNREAD_LEADS_COUNT }),
    );
    expect(countUnreadLeadsForTenantMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });
});
