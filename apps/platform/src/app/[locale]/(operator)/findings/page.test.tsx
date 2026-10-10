import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TOpenFinding } from '@blog/db/queries/findings';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';

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

const makeFinding = (overrides: Partial<TOpenFinding> = {}): TOpenFinding => ({
  id: 'finding-1',
  tenantId: 'tenant-1',
  source: FINDING_SOURCE.DOCUMENT_VALIDATION,
  kind: FINDING_KIND.SCHEMA_VALIDATION_ERROR,
  severity: FINDING_SEVERITY.WARNING,
  status: FINDING_STATUS.OPEN,
  dedupeKey: 'dedupe-1',
  hasDetails: false,
  firstSeenAt: new Date('2026-04-01T00:00:00.000Z'),
  lastSeenAt: new Date('2026-04-02T00:00:00.000Z'),
  resolvedAt: null,
  tenantName: 'Acme Inc.',
  ...overrides,
});

const setup = customRenderAsync(FindingsPage, {});

describe(FindingsPage, () => {
  beforeEach(() => {
    listOpenFindingsMock.mockReset();
  });

  it('renders every open finding with its tenant name', async () => {
    listOpenFindingsMock.mockResolvedValue([
      makeFinding({ id: 'finding-1', tenantId: 'tenant-1' }),
      makeFinding({ id: 'finding-2', tenantId: null, tenantName: null }),
    ]);

    await setup();

    expect(screen.getByRole('link', { name: 'Acme Inc.' })).toHaveAttribute(
      'href',
      '/tenants/tenant-1',
    );
    expect(screen.getByText('— platform-wide')).toBeVisible();
  });

  it('shows the healthy empty state when there are no open findings', async () => {
    listOpenFindingsMock.mockResolvedValue([]);

    await setup();

    expect(
      screen.getByText("No open findings. Everything's healthy."),
    ).toBeVisible();
  });
});
