import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockPendingProjectDomain } from '@platform/testing/domains/fixtures';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  mockTenant,
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import TenantDomainPage from './page';

const { getAdminByUserIdMock, getTenantByIdMock, getProjectDomainMock } =
  vi.hoisted(() => ({
    getAdminByUserIdMock: vi.fn(),
    getTenantByIdMock: vi.fn(),
    getProjectDomainMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
  },
}));

vi.mock('@platform/server/provisioning/vercel-domains-api', () => ({
  getProjectDomain: getProjectDomainMock,
}));

const t = makeEnTranslator('tenantDomainPage');

const setup = customRenderAsync(TenantDomainPage, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
});

describe(`<${TenantDomainPage.name}/>`, () => {
  beforeEach(() => {
    getAdminByUserIdMock.mockResolvedValue(mockAdmin());
    getTenantByIdMock.mockResolvedValue(
      mockTenant({ primaryDomain: MOCK_CUSTOM_DOMAIN }),
    );
    getProjectDomainMock.mockResolvedValue(mockPendingProjectDomain());
  });

  it('404s a signed-in user who is not an operator', async () => {
    getAdminByUserIdMock.mockResolvedValueOnce(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(getProjectDomainMock).not.toHaveBeenCalled();
  });

  it("renders the routed tenant's domain page", async () => {
    await setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: t('pageTitle'),
    });
    const cardHeading = await screen.findByRole('heading', {
      level: 2,
      name: t('cardTitle', { domain: MOCK_CUSTOM_DOMAIN }),
    });

    expect(heading).toBeVisible();
    expect(cardHeading).toBeVisible();
  });
});
