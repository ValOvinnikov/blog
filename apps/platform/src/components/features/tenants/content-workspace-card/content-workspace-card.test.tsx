import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  mockClientTenant,
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_CREATED_AT,
} from '@platform/testing/tenants/fixtures';

import { ContentWorkspaceCard } from './content-workspace-card';

faker.seed(5994);

const MOCK_SANITY_DATASET = faker.word.noun();
const MOCK_ENCRYPTED_TOKEN = faker.string.alphanumeric(24);

const setup = customRender(ContentWorkspaceCard, {
  tenant: mockClientTenant(),
});

describe(`<${ContentWorkspaceCard.name}/>`, () => {
  it("nests the card's title one level under the page's own h1", () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Content workspace',
    });

    expect(heading).toBeVisible();
  });

  it('shows Not set for every field of an unprovisioned tenant', () => {
    setup();

    const notSetTexts = screen.getAllByText('Not set');

    expect(notSetTexts).toHaveLength(4);
  });

  it('shows the project, dataset and Stored/Active badges once provisioned', () => {
    setup({
      tenant: mockClientTenant({
        sanityProjectId: MOCK_SANITY_PROJECT_ID,
        sanityDataset: MOCK_SANITY_DATASET,
        sanityReadTokenEncrypted: MOCK_ENCRYPTED_TOKEN,
        webhookCreatedAt: MOCK_TENANT_CREATED_AT,
      }),
    });

    const projectId = screen.getByText(MOCK_SANITY_PROJECT_ID);
    const dataset = screen.getByText(MOCK_SANITY_DATASET);
    const storedBadge = screen.getByText('Stored');
    const activeBadge = screen.getByText('Active');

    expect(projectId).toBeVisible();
    expect(dataset).toBeVisible();
    expect(storedBadge).toBeVisible();
    expect(activeBadge).toBeVisible();
  });
});
