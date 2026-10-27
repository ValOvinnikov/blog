import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_TENANT_NAME,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';

import TenantsPage from './page';

faker.seed(5996);

const { listTenantsMock } = vi.hoisted(() => ({
  listTenantsMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { tenants: { listTenants: listTenantsMock } },
}));

vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;

const MOCK_RESEND_API_KEY = `re_${faker.string.alphanumeric(24)}`;

const setup = customRenderAsync(TenantsPage, {
  searchParams: Promise.resolve({}),
});

describe(`<${TenantsPage.name}/>`, () => {
  beforeEach(() => {
    listTenantsMock.mockReset().mockResolvedValue([]);
    envMock.RESEND_API_KEY = MOCK_RESEND_API_KEY;
  });

  it('lists the tenants it reads', async () => {
    listTenantsMock.mockResolvedValueOnce([mockTenant()]);

    await setup();

    const tenantName = screen.getByText(MOCK_TENANT_NAME);

    expect(tenantName).toBeVisible();
  });

  it.each([
    { archived: undefined, includeArchived: false },
    { archived: '1', includeArchived: true },
  ])(
    'reads archived tenants only when asked: $archived',
    async ({ archived, includeArchived }) => {
      await setup({ searchParams: Promise.resolve({ archived }) });

      expect(listTenantsMock).toHaveBeenCalledWith({ includeArchived });
    },
  );

  it('hides the email-alerts banner when Resend is configured', async () => {
    await setup();

    const banner = screen.queryByText(messages.emailAlertsBanner.title);

    expect(banner).not.toBeInTheDocument();
  });

  it('shows the email-alerts banner when Resend is not configured', async () => {
    envMock.RESEND_API_KEY = undefined;

    await setup();

    const banner = screen.getByText(messages.emailAlertsBanner.title);

    expect(banner).toBeVisible();
  });
});
