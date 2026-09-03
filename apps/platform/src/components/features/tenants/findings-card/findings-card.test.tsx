import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TFinding } from '@blog/db/schema/findings';
import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { FindingsCard } from './findings-card';

const render = renderWithIntl;

const makeFinding = (overrides: Partial<TFinding> = {}): TFinding => ({
  id: 'finding-1',
  tenantId: 'tenant-1',
  source: FINDING_SOURCE.TENANT_PROVISIONING,
  kind: FINDING_KIND.PROVISIONING_STEP_FAILED,
  severity: FINDING_SEVERITY.CRITICAL,
  status: FINDING_STATUS.OPEN,
  dedupeKey: 'dedupe-1',
  details: null,
  firstSeenAt: new Date('2026-04-01T00:00:00.000Z'),
  lastSeenAt: new Date('2026-04-02T00:00:00.000Z'),
  resolvedAt: null,
  ...overrides,
});

describe(FindingsCard, () => {
  it("nests the card's title one level under the page's own h1", () => {
    render(<FindingsCard findings={[]} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Open findings' }),
    ).toBeVisible();
  });

  it('renders a finding with its source, kind and severity', () => {
    render(<FindingsCard findings={[makeFinding()]} />);

    expect(screen.getByText('Tenant provisioning')).toBeVisible();
    expect(screen.getByText('Provisioning step failed')).toBeVisible();
    expect(screen.getByText('Critical')).toBeVisible();
  });

  it('renders a Details disclosure only when the finding carries details', () => {
    render(
      <FindingsCard
        findings={[
          makeFinding({ id: 'finding-1', details: { step: 'MAP_DOMAIN' } }),
          makeFinding({ id: 'finding-2', details: null }),
        ]}
      />,
    );

    expect(screen.getAllByText('Details')).toHaveLength(1);
  });

  it('shows a healthy empty state when there are no open findings', () => {
    render(<FindingsCard findings={[]} />);

    expect(
      screen.getByText(
        "No open findings for this tenant — everything's healthy.",
      ),
    ).toBeVisible();
  });
});
