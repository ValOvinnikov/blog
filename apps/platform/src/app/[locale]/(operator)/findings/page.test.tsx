import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TFinding } from '@blog/db/schema/findings';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import FindingsPage from './page';

const { listOpenFindingsMock, listTenantsByIdsMock } = vi.hoisted(() => ({
  listOpenFindingsMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    findings: { listOpenFindings: listOpenFindingsMock },
    tenants: { listTenantsByIds: listTenantsByIdsMock },
  },
}));

const makeFinding = (overrides: Partial<TFinding> = {}): TFinding => ({
  id: 'finding-1',
  tenantId: 'tenant-1',
  source: FINDING_SOURCE.DOCUMENT_VALIDATION,
  kind: FINDING_KIND.SCHEMA_VALIDATION_ERROR,
  severity: FINDING_SEVERITY.WARNING,
  status: FINDING_STATUS.OPEN,
  dedupeKey: 'dedupe-1',
  details: null,
  firstSeenAt: new Date('2026-04-01T00:00:00.000Z'),
  lastSeenAt: new Date('2026-04-02T00:00:00.000Z'),
  resolvedAt: null,
  ...overrides,
});

const setup = customRenderAsync(FindingsPage, {});

describe(FindingsPage, () => {
  beforeEach(() => {
    listOpenFindingsMock.mockReset();
    listTenantsByIdsMock.mockReset();
    listTenantsByIdsMock.mockResolvedValue([]);
  });

  it('renders every open finding, resolving tenant names in a single batch query', async () => {
    listOpenFindingsMock.mockResolvedValue([
      makeFinding({ id: 'finding-1', tenantId: 'tenant-1' }),
      makeFinding({ id: 'finding-2', tenantId: null }),
    ]);
    listTenantsByIdsMock.mockResolvedValue([makeTenant({ id: 'tenant-1' })]);

    await setup();

    expect(listTenantsByIdsMock).toHaveBeenCalledWith(['tenant-1']);
    expect(screen.getByRole('link', { name: 'Acme Inc.' })).toHaveAttribute(
      'href',
      '/tenants/tenant-1',
    );
    expect(screen.getByText('— platform-wide')).toBeVisible();
  });

  it('never queries tenants when every open finding is tenant-less', async () => {
    listOpenFindingsMock.mockResolvedValue([makeFinding({ tenantId: null })]);

    await setup();

    expect(listTenantsByIdsMock).not.toHaveBeenCalled();
  });

  it('shows the healthy empty state when there are no open findings', async () => {
    listOpenFindingsMock.mockResolvedValue([]);

    await setup();

    expect(
      screen.getByText("No open findings. Everything's healthy."),
    ).toBeVisible();
  });
});
