import { FINDING_KIND, FINDING_SOURCE } from '@blog/config/constants';
import { mockContrastResult } from '@blog/db/testing/findings/fixtures';
import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  mockFinding,
  MOCK_COMMIT_SHA,
  MOCK_FINDING_LAST_SEEN_AT,
  MOCK_SHORT_COMMIT_SHA,
} from '@platform/testing/findings/fixtures';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { FindingsTable } from './findings-table';

faker.seed(5993);

const MOCK_FINDING = mockFinding();
const MOCK_CONTRAST_RESULT = mockContrastResult({ sha: MOCK_COMMIT_SHA });

const {
  findingsTable,
  findingsView,
  findingSourceLabel,
  findingKindLabel,
  findingSeverityLabel,
} = messages;
const tContrast = makeEnTranslator('contrastFindingDetails');

const setup = customRender(FindingsTable, { findings: [MOCK_FINDING] });

describe(`<${FindingsTable.name}/>`, () => {
  describe('with a tenant finding', () => {
    beforeEach(() => {
      setup();
    });

    it("shows the finding's source, kind, severity and last-seen date", () => {
      const source = screen.getByText(findingSourceLabel[MOCK_FINDING.source]);
      const kind = screen.getByText(findingKindLabel[MOCK_FINDING.kind]);
      const severity = screen.getByText(
        findingSeverityLabel[MOCK_FINDING.severity],
      );
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
      const region = screen.getByRole('region', { name: findingsView.title });
      const table = screen.getByRole('table');

      expect(region).toContainElement(table);
    });

    it("links the tenant name to that tenant's overview page", () => {
      const tenantLink = screen.getByRole('link', { name: MOCK_TENANT_NAME });

      expect(tenantLink).toHaveAttribute(
        'href',
        adminRoutes.tenantOverview(MOCK_TENANT_ID),
      );
    });
  });

  it('shows a platform-wide placeholder for a finding with no tenant', () => {
    setup({ findings: [mockFinding({ tenantId: null, tenantName: null })] });

    const placeholder = screen.getByText(findingsTable.noTenant);
    const link = screen.queryByRole('link');

    expect(placeholder).toBeVisible();
    expect(link).not.toBeInTheDocument();
  });

  it('shows the contrast run of a contrast finding', () => {
    setup({
      findings: [
        mockFinding({
          source: FINDING_SOURCE.CONTRAST_CHECK,
          kind: FINDING_KIND.CONTRAST_REGRESSION,
          contrastResult: MOCK_CONTRAST_RESULT,
        }),
      ],
    });

    const runLink = screen.getByRole('link', {
      name: tContrast('viewRunLabel', { sha: MOCK_SHORT_COMMIT_SHA }),
    });

    expect(runLink).toHaveAttribute('href', MOCK_CONTRAST_RESULT.runUrl);
  });

  it('shows a healthy empty state instead of a table with no open findings', () => {
    setup({ findings: [] });

    const emptyMessage = screen.getByText(findingsTable.empty);
    const table = screen.queryByRole('table');

    expect(emptyMessage).toBeVisible();
    expect(table).not.toBeInTheDocument();
  });
});
