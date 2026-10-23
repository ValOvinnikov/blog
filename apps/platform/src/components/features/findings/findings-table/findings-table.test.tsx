import {
  CONTRAST_CHECK_OUTCOME,
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
} from '@blog/config/constants';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  makeFinding,
  MOCK_FINDING_LAST_SEEN_AT,
} from '@platform/testing/findings/fixtures';
import {
  MOCK_TENANT_NAME,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import { FindingsTable } from './findings-table';

const render = renderWithIntl;

const PLATFORM_WIDE = '— platform-wide';
const WORKFLOW_RUN_URL = 'https://github.com/acme/blog/actions/runs/7';

describe(`<${FindingsTable.name}/>`, () => {
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

    const source = screen.getByText('Document validation');
    const kind = screen.getByText('Schema validation error');
    const severity = screen.getByText('Warning');
    const lastSeen = screen.getByText('Apr 2, 2026');

    expect(source).toBeVisible();
    expect(kind).toBeVisible();
    expect(severity).toBeVisible();
    expect(lastSeen).toHaveAttribute(
      'dateTime',
      MOCK_FINDING_LAST_SEEN_AT.toISOString(),
    );
  });

  it('names the scrollable table region after the page', () => {
    render(<FindingsTable findings={[makeFinding()]} />);

    const region = screen.getByRole('region', { name: 'Findings' });
    const table = screen.getByRole('table');

    expect(region).toContainElement(table);
  });

  it("links a finding's tenant name to that tenant's overview page", () => {
    render(<FindingsTable findings={[makeFinding({ tenantId: TENANT_ID })]} />);

    const tenantLink = screen.getByRole('link', { name: MOCK_TENANT_NAME });

    expect(tenantLink).toHaveAttribute('href', `/tenants/${TENANT_ID}`);
  });

  it('shows a platform-wide placeholder instead of a tenant link for a tenant-less finding', () => {
    render(
      <FindingsTable
        findings={[makeFinding({ tenantId: null, tenantName: null })]}
      />,
    );

    const placeholder = screen.getByText(PLATFORM_WIDE);
    const link = screen.queryByRole('link');

    expect(placeholder).toBeVisible();
    expect(link).not.toBeInTheDocument();
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
              runUrl: WORKFLOW_RUN_URL,
            },
          }),
        ]}
      />,
    );

    const placeholder = screen.getByText(PLATFORM_WIDE);
    const commit = screen.getByText('abcdef0');
    const failureCount = screen.getByText('1 failure');
    const runLink = screen.getByRole('link', {
      name: 'View the contrast run for commit abcdef0 (opens in new tab)',
    });

    expect(placeholder).toBeVisible();
    expect(commit).toBeVisible();
    expect(failureCount).toBeVisible();
    expect(runLink).toHaveAttribute('href', WORKFLOW_RUN_URL);
  });

  it('renders a healthy empty state instead of an empty table when there are no open findings', () => {
    render(<FindingsTable findings={[]} />);

    const emptyMessage = screen.getByText(
      "No open findings. Everything's healthy.",
    );
    const table = screen.queryByRole('table');

    expect(emptyMessage).toBeVisible();
    expect(table).not.toBeInTheDocument();
  });
});
