import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  TENANT_PLAN,
  ERROR_CODE,
} from '@shinefold/config/constants';
import {
  listFindingsForTenant,
  openFinding,
  resolveFinding,
} from '@shinefold/db/queries/findings';
import { toTenantSanityCredentials } from '@shinefold/db/queries/tenants';
import { errorResult, okResult } from '@shinefold/utils';
import {
  DOCUMENT_CAP_CHECK,
  DOCUMENT_CAP_FINDING_IDENTIFIER,
  DOCUMENT_CAP_WARNING_RATIO,
  PLAN_DOCUMENT_CAP,
} from '@worker/constants/document-cap';
import { mockOpenFindingSummary } from '@worker/testing/finding/fixtures';
import {
  MOCK_SANITY_CREDENTIALS,
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';

import { checkTenantDocumentCap } from './check-tenant-document-cap';
import { countTenantDocuments } from './count-tenant-documents';

vi.mock('@shinefold/db/queries/findings');
vi.mock('@shinefold/db/queries/tenants');
vi.mock('./count-tenant-documents');

const MOCK_FREE_CAP = PLAN_DOCUMENT_CAP[TENANT_PLAN.FREE] ?? 0;
const MOCK_COUNT_AT_THRESHOLD = Math.ceil(
  MOCK_FREE_CAP * DOCUMENT_CAP_WARNING_RATIO,
);
const MOCK_COUNT_UNDER_THRESHOLD = MOCK_COUNT_AT_THRESHOLD - 1;

function mockOpenCapFinding() {
  vi.mocked(listFindingsForTenant).mockResolvedValue([
    mockOpenFindingSummary(FINDING_KIND.DOCUMENT_CAP_APPROACHING),
  ]);
}

describe(checkTenantDocumentCap, () => {
  beforeEach(() => {
    vi.mocked(toTenantSanityCredentials).mockReturnValue(
      MOCK_SANITY_CREDENTIALS,
    );
    vi.mocked(listFindingsForTenant).mockResolvedValue([]);
    vi.mocked(openFinding).mockResolvedValue(okResult({} as never));
    vi.mocked(resolveFinding).mockResolvedValue(okResult({} as never));
    vi.mocked(countTenantDocuments).mockResolvedValue(MOCK_COUNT_AT_THRESHOLD);
  });

  it('opens a warning naming count and cap at the threshold', async () => {
    const outcome = await checkTenantDocumentCap(mockProvisionedTenant());

    expect(outcome).toBe(DOCUMENT_CAP_CHECK.NEARING);
    expect(openFinding).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
      source: FINDING_SOURCE.DOCUMENT_COUNT_CHECK,
      kind: FINDING_KIND.DOCUMENT_CAP_APPROACHING,
      identifier: DOCUMENT_CAP_FINDING_IDENTIFIER,
      severity: FINDING_SEVERITY.WARNING,
      details: {
        documentCount: MOCK_COUNT_AT_THRESHOLD,
        documentCap: MOCK_FREE_CAP,
      },
    });
  });

  it('resolves the open warning once the count drops back under the threshold', async () => {
    vi.mocked(countTenantDocuments).mockResolvedValue(
      MOCK_COUNT_UNDER_THRESHOLD,
    );
    mockOpenCapFinding();

    const outcome = await checkTenantDocumentCap(mockProvisionedTenant());

    expect(outcome).toBe(DOCUMENT_CAP_CHECK.CLEAR);
    expect(openFinding).not.toHaveBeenCalled();
    expect(resolveFinding).toHaveBeenCalledOnce();
  });

  it('never counts a paid tenant, and resolves a warning left from its free days', async () => {
    mockOpenCapFinding();

    const outcome = await checkTenantDocumentCap(
      mockProvisionedTenant({ plan: TENANT_PLAN.GROWTH }),
    );

    expect(outcome).toBe(DOCUMENT_CAP_CHECK.SKIPPED);
    expect(countTenantDocuments).not.toHaveBeenCalled();
    expect(openFinding).not.toHaveBeenCalled();
    expect(resolveFinding).toHaveBeenCalledOnce();
  });

  it('skips a free tenant with no Sanity project yet', async () => {
    vi.mocked(toTenantSanityCredentials).mockReturnValue(undefined);

    const outcome = await checkTenantDocumentCap(mockProvisionedTenant());

    expect(outcome).toBe(DOCUMENT_CAP_CHECK.SKIPPED);
    expect(countTenantDocuments).not.toHaveBeenCalled();
  });

  it('throws when the warning cannot be opened', async () => {
    vi.mocked(openFinding).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    await expect(
      checkTenantDocumentCap(mockProvisionedTenant()),
    ).rejects.toThrow(/could not be opened/);
  });
});
