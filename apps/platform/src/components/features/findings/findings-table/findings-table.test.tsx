import {
  CONTRAST_CHECK_OUTCOME,
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
} from '@blog/config/constants';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { makeFinding } from '@platform/testing/findings/fixtures';

import { FindingsTable } from './findings-table';

const render = renderWithIntl;

describe(FindingsTable, () => {
  it('renders one row per finding with its source, kind, severity and last-seen date', () => {
    render(
      <FindingsTable
        findings={[
          makeFinding({
            source: FINDING_SOURCE.DOCUMENT_VALIDATION,
            kind: FINDING_KIND.SCHEMA_VALIDATION_ERROR,
            severity: FINDING_SEVERITY.WARNING,
          }),
        ]}
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

  it('names the scrollable table region after the page', () => {
    render(<FindingsTable findings={[makeFinding()]} />);

    expect(screen.getByRole('region', { name: 'Findings' })).toContainElement(
      screen.getByRole('table'),
    );
  });

  it("links a finding's tenant name to that tenant's overview page", () => {
    render(
      <FindingsTable findings={[makeFinding({ tenantId: 'tenant-1' })]} />,
    );

    expect(screen.getByRole('link', { name: 'Acme Inc.' })).toHaveAttribute(
      'href',
      '/tenants/tenant-1',
    );
  });

  it('shows a platform-wide placeholder instead of a tenant link for a tenant-less finding', () => {
    render(
      <FindingsTable
        findings={[makeFinding({ tenantId: null, tenantName: null })]}
      />,
    );

    expect(screen.getByText('— platform-wide')).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows the commit and run of a platform-wide contrast finding', () => {
    render(
      <FindingsTable
        findings={[
          makeFinding({
            tenantId: null,
            tenantName: null,
            source: FINDING_SOURCE.CONTRAST_CHECK,
            kind: FINDING_KIND.CONTRAST_REGRESSION,
            contrastResult: {
              sha: 'abcdef0123456789abcdef0123456789abcdef01',
              outcome: CONTRAST_CHECK_OUTCOME.FAIL,
              failureCount: 1,
              runUrl: 'https://github.com/acme/blog/actions/runs/7',
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText('— platform-wide')).toBeVisible();
    expect(screen.getByText('abcdef0')).toBeVisible();
    expect(screen.getByText('1 failure')).toBeVisible();
    expect(
      screen.getByRole('link', {
        name: 'View the contrast run for commit abcdef0 (opens in new tab)',
      }),
    ).toHaveAttribute('href', 'https://github.com/acme/blog/actions/runs/7');
  });

  it('renders a healthy empty state instead of an empty table when there are no open findings', () => {
    render(<FindingsTable findings={[]} />);

    expect(
      screen.getByText("No open findings. Everything's healthy."),
    ).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
