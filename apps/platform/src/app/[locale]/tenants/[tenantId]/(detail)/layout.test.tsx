import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockPlatformNewsletterTenant } from '@platform/testing/subscribers/fixtures';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { noEntitlementGrantQueries } from '@platform/testing/tenants/no-entitlement-grant-queries';
import { TENANT_PLAN } from '@shinefold/config';
import { ADMIN_ROLE, type TAdminRole } from '@shinefold/db/constants';
import type { TTenant } from '@shinefold/db/schema/tenants';

import TenantDetailLayout from './layout';

faker.seed(6302);

const { getAdminByUserIdMock, getTenantByIdMock } = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: vi.fn() })),
  headers: vi.fn(async () => new Headers()),
}));

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    ...noEntitlementGrantQueries(),
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
  },
}));

const { navSections } = messages;
const t = makeEnTranslator('navSections');

const MOCK_TENANT_CONTENT = faker.lorem.sentence();

const setup = customRenderAsync(TenantDetailLayout, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
  children: <div>{MOCK_TENANT_CONTENT}</div>,
});

describe(`<${TenantDetailLayout.name}/>`, () => {
  beforeEach(() => {
    getAdminByUserIdMock.mockResolvedValue(mockAdmin());
    getTenantByIdMock.mockResolvedValue(mockReadyTenant());
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

    it('shows Leads in the sidebar with no unread-count badge', () => {
      const leadsLink = screen.getByRole('link', { name: navSections.leads });

      expect(leadsLink).toBeVisible();
    });

    it('renders no tenant switcher in the sidebar', () => {
      const tenantDomain = screen.queryByText(MOCK_TENANT_DOMAIN);

      expect(tenantDomain).not.toBeInTheDocument();
    });
  });

  it('shows a super admin Subscribers on a platform-created site', async () => {
    getAdminByUserIdMock.mockResolvedValue(
      mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
    );
    getTenantByIdMock.mockResolvedValue(mockPlatformNewsletterTenant());
    await setup();

    const subscribersLink = screen.getByRole('link', {
      name: navSections.subscribers,
    });

    expect(subscribersLink).toBeVisible();
  });

  it.each<[string, TAdminRole, Partial<TTenant>]>([
    ['an admin on a platform-created site', ADMIN_ROLE.ADMIN, {}],
    [
      'a super admin on a self-serve site',
      ADMIN_ROLE.SUPERADMIN,
      { createdFromPlatform: false },
    ],
    [
      'a super admin on a site without Newsletter',
      ADMIN_ROLE.SUPERADMIN,
      { plan: TENANT_PLAN.FREE },
    ],
  ])(
    'shows %s no Subscribers entry',
    async (_viewer, role, tenantOverrides) => {
      getAdminByUserIdMock.mockResolvedValue(mockAdmin({ role }));
      getTenantByIdMock.mockResolvedValue(
        mockPlatformNewsletterTenant(tenantOverrides),
      );
      await setup();

      const subscribersLink = screen.queryByRole('link', {
        name: navSections.subscribers,
      });

      expect(subscribersLink).not.toBeInTheDocument();
    },
  );
});
