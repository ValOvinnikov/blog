import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TFindingSummary } from '@blog/db/schema/findings';
import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { FindingsCard } from './findings-card';

vi.mock('@platform/server/findings/get-finding-details-action', () => ({
  getFindingDetailsAction: vi.fn(),
}));

const render = renderWithIntl;

const makeFinding = (
  overrides: Partial<TFindingSummary> = {},
): TFindingSummary => ({
  id: 'finding-1',
  tenantId: 'tenant-1',
  source: FINDING_SOURCE.TENANT_PROVISIONING,
  kind: FINDING_KIND.PROVISIONING_STEP_FAILED,
  severity: FINDING_SEVERITY.CRITICAL,
  status: FINDING_STATUS.OPEN,
  dedupeKey: 'dedupe-1',
  hasDetails: false,
  firstSeenAt: new Date('2026-04-01T00:00:00.000Z'),
  lastSeenAt: new Date('2026-04-02T00:00:00.000Z'),
  resolvedAt: null,
  ...overrides,
});

describe(FindingsCard, () => {
  describe('with no findings', () => {
    beforeEach(() => {
      render(<FindingsCard tenantId="tenant-1" findings={[]} />);
    });

    it("nests the card's title one level under the page's own h1", () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'Open findings' }),
      ).toBeVisible();
    });

    it('shows a healthy empty state when there are no open findings', () => {
      expect(
        screen.getByText(
          "No open findings for this tenant — everything's healthy.",
        ),
      ).toBeVisible();
    });
  });

  it('renders a finding with its source, kind and severity', () => {
    render(<FindingsCard tenantId="tenant-1" findings={[makeFinding()]} />);

    expect(screen.getByText('Tenant provisioning')).toBeVisible();
    expect(screen.getByText('Provisioning step failed')).toBeVisible();
    expect(screen.getByText('Critical')).toBeVisible();
  });

  it('renders a Details disclosure only when the finding carries details', () => {
    render(
      <FindingsCard
        tenantId="tenant-1"
        findings={[
          makeFinding({ id: 'finding-1', hasDetails: true }),
          makeFinding({ id: 'finding-2', hasDetails: false }),
        ]}
      />,
    );

    expect(screen.getAllByText('Details')).toHaveLength(1);
  });
});
