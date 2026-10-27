import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID, mockTenant } from '@platform/testing/tenants/fixtures';

import TenantByIdLayout from './layout';

faker.seed(4127);

const { getAdminByUserIdMock, getTenantByIdMock } = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
  },
}));

const MOCK_TENANT_CONTENT = faker.lorem.sentence();

const setup = customRenderAsync(TenantByIdLayout, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
  children: <div>{MOCK_TENANT_CONTENT}</div>,
});

describe(`<${TenantByIdLayout.name}/>`, () => {
  beforeEach(() => {
    getAdminByUserIdMock.mockResolvedValue(mockAdmin());
    getTenantByIdMock.mockResolvedValue(mockTenant());
  });

  it('404s for an unknown tenant id', async () => {
    getTenantByIdMock.mockResolvedValueOnce(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  });

  it('renders the gated content bare, without the admin shell', async () => {
    await setup();

    const content = screen.getByText(MOCK_TENANT_CONTENT);
    const platformSection = screen.queryByText(
      messages.navSections.platformLabel,
      { selector: 'p' },
    );

    expect(content).toBeVisible();
    expect(platformSection).not.toBeInTheDocument();
  });
});
