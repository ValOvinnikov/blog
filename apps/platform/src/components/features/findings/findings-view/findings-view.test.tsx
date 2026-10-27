import { customRender, screen } from '@platform/testing/custom-render';
import { mockFinding } from '@platform/testing/findings/fixtures';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';

import { FindingsView } from './findings-view';

const setup = customRender(FindingsView, { findings: [mockFinding()] });

describe(`<${FindingsView.name}/>`, () => {
  it('shows the page heading above the findings table', () => {
    setup();

    const heading = screen.getByRole('heading', { name: 'Findings' });
    const tenantLink = screen.getByRole('link', { name: MOCK_TENANT_NAME });

    expect(heading).toBeVisible();
    expect(tenantLink).toBeVisible();
  });
});
