import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  makeClientTenant,
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_CREATED_AT,
} from '@platform/testing/tenants/fixtures';

import { ContentWorkspaceCard } from './content-workspace-card';

const render = renderWithIntl;

describe(`<${ContentWorkspaceCard.name}/>`, () => {
  it("nests the card's title one level under the page's own h1", () => {
    render(<ContentWorkspaceCard tenant={makeClientTenant()} />);

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Content workspace',
    });

    expect(heading).toBeVisible();
  });

  it("shows 'Not set' for content-workspace fields the tenant has not been provisioned with yet", () => {
    const tenant = makeClientTenant({
      sanityProjectId: null,
      sanityDataset: null,
      sanityReadTokenEncrypted: null,
      webhookCreatedAt: null,
    });
    render(<ContentWorkspaceCard tenant={tenant} />);

    const notSetTexts = screen.getAllByText('Not set');
    expect(notSetTexts.length).toBeGreaterThan(0);
  });

  it('shows Stored/Active badges once the token and webhook exist', () => {
    const tenant = makeClientTenant({
      sanityProjectId: MOCK_SANITY_PROJECT_ID,
      sanityDataset: 'production',
      sanityReadTokenEncrypted: 'encrypted-value',
      webhookCreatedAt: MOCK_TENANT_CREATED_AT,
    });
    render(<ContentWorkspaceCard tenant={tenant} />);

    const storedBadge = screen.getByText('Stored');
    const activeBadge = screen.getByText('Active');
    const projectId = screen.getByText(MOCK_SANITY_PROJECT_ID);

    expect(storedBadge).toBeVisible();
    expect(activeBadge).toBeVisible();
    expect(projectId).toBeVisible();
  });
});
