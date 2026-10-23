import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
} from '@blog/config/constants';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { mockFinding } from '@platform/testing/findings/fixtures';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';

import { FindingsView } from './findings-view';

const render = renderWithIntl;

const finding = mockFinding({
  source: FINDING_SOURCE.DOCUMENT_VALIDATION,
  kind: FINDING_KIND.SCHEMA_VALIDATION_ERROR,
  severity: FINDING_SEVERITY.WARNING,
});

describe(FindingsView, () => {
  it('renders the page heading and the real findings table', () => {
    render(<FindingsView findings={[finding]} />);

    const heading = screen.getByRole('heading', { name: 'Findings' });
    const tenantLink = screen.getByRole('link', { name: MOCK_TENANT_NAME });

    expect(heading).toBeVisible();
    expect(tenantLink).toBeVisible();
  });

  it('renders the healthy empty state when there are no open findings', () => {
    render(<FindingsView findings={[]} />);

    const emptyState = screen.getByText(
      "No open findings. Everything's healthy.",
    );

    expect(emptyState).toBeVisible();
  });
});
