import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
} from '@blog/config/constants';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { mockFinding } from '@platform/testing/findings/fixtures';

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

    expect(screen.getByRole('heading', { name: 'Findings' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Acme Inc.' })).toBeVisible();
  });
});
