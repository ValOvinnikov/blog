import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockFinding } from '@platform/testing/findings/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import { FindingsCard } from './findings-card';

vi.mock('@platform/server/findings/get-finding-details-action', () => ({
  getFindingDetailsAction: vi.fn(),
}));

faker.seed(5994);

const MOCK_FINDING_WITH_DETAILS_ID = faker.string.uuid();
const MOCK_FINDING_WITHOUT_DETAILS_ID = faker.string.uuid();

const setup = customRender(FindingsCard, {
  tenantId: MOCK_TENANT_ID,
  findings: [],
});

describe(`<${FindingsCard.name}/>`, () => {
  describe('with no findings', () => {
    beforeEach(() => {
      setup();
    });

    it("nests the card's title one level under the page's own h1", () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: 'Open findings',
      });

      expect(heading).toBeVisible();
    });

    it('shows a healthy empty state', () => {
      const emptyState = screen.getByText(
        "No open findings for this tenant — everything's healthy.",
      );

      expect(emptyState).toBeVisible();
    });
  });

  it('renders a finding with its source, kind and severity', () => {
    setup({ findings: [mockFinding()] });

    const source = screen.getByText('Tenant provisioning');
    const kind = screen.getByText('Provisioning step failed');
    const severity = screen.getByText('Critical');

    expect(source).toBeVisible();
    expect(kind).toBeVisible();
    expect(severity).toBeVisible();
  });

  it('offers a Details disclosure only for a finding that carries details', () => {
    setup({
      findings: [
        mockFinding({ id: MOCK_FINDING_WITH_DETAILS_ID, hasDetails: true }),
        mockFinding({
          id: MOCK_FINDING_WITHOUT_DETAILS_ID,
          hasDetails: false,
        }),
      ],
    });

    const detailsToggles = screen.getAllByText('Details');

    expect(detailsToggles).toHaveLength(1);
  });
});
