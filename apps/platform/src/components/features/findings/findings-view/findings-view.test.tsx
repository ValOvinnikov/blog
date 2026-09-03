import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TFinding } from '@blog/db/schema/findings';
import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { FindingsView } from './findings-view';

const render = renderWithIntl;

const finding: TFinding = {
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
};

describe(FindingsView, () => {
  it('renders the page heading and the real findings table', () => {
    render(
      <FindingsView
        findings={[finding]}
        tenantNamesById={{ 'tenant-1': 'Acme Inc.' }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Findings' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Acme Inc.' })).toBeVisible();
  });

  it('renders the healthy empty state when there are no open findings', () => {
    render(<FindingsView findings={[]} tenantNamesById={{}} />);

    expect(
      screen.getByText("No open findings. Everything's healthy."),
    ).toBeVisible();
  });
});
