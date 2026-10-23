import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeFinding } from '@platform/testing/findings/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_TENANT_NAME,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import FindingsPage from './page';

const { listOpenFindingsMock } = vi.hoisted(() => ({
  listOpenFindingsMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    findings: { listOpenFindings: listOpenFindingsMock },
  },
}));

const setup = customRenderAsync(FindingsPage, {});

describe(FindingsPage, () => {
  beforeEach(() => {
    listOpenFindingsMock.mockReset();
  });

  it('renders every open finding with its tenant name', async () => {
    listOpenFindingsMock.mockResolvedValue([
      makeFinding({ id: 'finding-1', tenantId: TENANT_ID }),
      makeFinding({ id: 'finding-2', tenantId: null, tenantName: null }),
    ]);

    await setup();

    const tenantLink = screen.getByRole('link', { name: MOCK_TENANT_NAME });
    const platformWide = screen.getByText('— platform-wide');

    expect(tenantLink).toHaveAttribute(
      'href',
      adminRoutes.tenantOverview(TENANT_ID),
    );
    expect(platformWide).toBeVisible();
  });

  it('shows the healthy empty state when there are no open findings', async () => {
    listOpenFindingsMock.mockResolvedValue([]);

    await setup();

    const emptyState = screen.getByText(
      "No open findings. Everything's healthy.",
    );

    expect(emptyState).toBeVisible();
  });
});
