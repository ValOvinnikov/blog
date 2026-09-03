import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TFinding } from '@blog/db/schema/findings';
import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { FindingsTable } from './findings-table';

const render = renderWithIntl;

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

describe(FindingsTable, () => {
  it('renders one row per finding with its source, kind, severity and last-seen date', () => {
    render(
      <FindingsTable
        findings={[makeFinding()]}
        tenantNamesById={{ 'tenant-1': 'Acme Inc.' }}
      />,
    );

    expect(screen.getByText('Document validation')).toBeVisible();
    expect(screen.getByText('Schema validation error')).toBeVisible();
    expect(screen.getByText('Warning')).toBeVisible();
    expect(screen.getByText('Apr 2, 2026')).toHaveAttribute(
      'dateTime',
      '2026-04-02T00:00:00.000Z',
    );
  });

  it("links a finding's tenant name to that tenant's overview page", () => {
    render(
      <FindingsTable
        findings={[makeFinding({ tenantId: 'tenant-1' })]}
        tenantNamesById={{ 'tenant-1': 'Acme Inc.' }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Acme Inc.' })).toHaveAttribute(
      'href',
      '/tenants/tenant-1',
    );
  });

  it('shows a platform-wide placeholder instead of a tenant link for a tenant-less finding', () => {
    render(
      <FindingsTable
        findings={[makeFinding({ tenantId: null })]}
        tenantNamesById={{}}
      />,
    );

    expect(screen.getByText('— platform-wide')).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a healthy empty state instead of an empty table when there are no open findings', () => {
    render(<FindingsTable findings={[]} tenantNamesById={{}} />);

    expect(
      screen.getByText("No open findings. Everything's healthy."),
    ).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
