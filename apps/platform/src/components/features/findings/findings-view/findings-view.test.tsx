import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
} from '@blog/config/constants';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { makeFinding } from '@platform/testing/findings/fixtures';

import { FindingsView } from './findings-view';

const render = renderWithIntl;

const finding = makeFinding({
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

  it('renders the healthy empty state when there are no open findings', () => {
    render(<FindingsView findings={[]} />);

    expect(
      screen.getByText("No open findings. Everything's healthy."),
    ).toBeVisible();
  });
});
