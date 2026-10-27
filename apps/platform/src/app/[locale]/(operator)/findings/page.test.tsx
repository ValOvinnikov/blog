import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockFinding } from '@platform/testing/findings/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import FindingsPage from './page';

faker.seed(5996);

const { listOpenFindingsMock } = vi.hoisted(() => ({
  listOpenFindingsMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    findings: { listOpenFindings: listOpenFindingsMock },
  },
}));

const MOCK_PLATFORM_FINDING_ID = faker.string.uuid();

const setup = customRenderAsync(FindingsPage, {});

describe(`<${FindingsPage.name}/>`, () => {
  it('lists every open finding with its tenant', async () => {
    listOpenFindingsMock.mockResolvedValueOnce([
      mockFinding(),
      mockFinding({
        id: MOCK_PLATFORM_FINDING_ID,
        tenantId: null,
        tenantName: null,
      }),
    ]);

    await setup();

    const tenantLink = screen.getByRole('link', { name: MOCK_TENANT_NAME });
    const platformWide = screen.getByText(messages.findingsTable.noTenant);

    expect(tenantLink).toHaveAttribute(
      'href',
      adminRoutes.tenantOverview(MOCK_TENANT_ID),
    );
    expect(platformWide).toBeVisible();
  });
});
