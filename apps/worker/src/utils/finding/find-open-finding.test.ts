import {
  ERROR_CODE,
  FINDING_KIND,
  FINDING_STATUS,
} from '@shinefold/config/constants';
import {
  listFindingsForTenant,
  resolveFinding,
} from '@shinefold/db/queries/findings';
import { errorResult, okResult } from '@shinefold/utils';
import {
  MOCK_FINDING_ID,
  mockOpenFindingSummary,
} from '@worker/testing/finding/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';

import { findOpenFinding, resolveOpenFinding } from './find-open-finding';

vi.mock('@shinefold/db/queries/findings');

const MOCK_CAP_FINDING = mockOpenFindingSummary(
  FINDING_KIND.DOCUMENT_CAP_APPROACHING,
);

describe(findOpenFinding, () => {
  it('returns the open finding of the given kind among the tenant’s open ones', async () => {
    vi.mocked(listFindingsForTenant).mockResolvedValue([
      mockOpenFindingSummary(FINDING_KIND.OWNER_ACCESS_CHECK_FAILED),
      MOCK_CAP_FINDING,
    ]);

    const finding = await findOpenFinding(
      MOCK_TENANT_ID,
      FINDING_KIND.DOCUMENT_CAP_APPROACHING,
    );

    expect(finding).toBe(MOCK_CAP_FINDING);
    expect(listFindingsForTenant).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      FINDING_STATUS.OPEN,
    );
  });
});

describe(resolveOpenFinding, () => {
  beforeEach(() => {
    vi.mocked(listFindingsForTenant).mockResolvedValue([MOCK_CAP_FINDING]);
  });

  it('resolves the open finding of the given kind', async () => {
    vi.mocked(resolveFinding).mockResolvedValue(okResult({} as never));

    await resolveOpenFinding(
      MOCK_TENANT_ID,
      FINDING_KIND.DOCUMENT_CAP_APPROACHING,
    );

    expect(resolveFinding).toHaveBeenCalledWith(MOCK_FINDING_ID);
  });

  it('does nothing when no finding of that kind is open', async () => {
    await resolveOpenFinding(
      MOCK_TENANT_ID,
      FINDING_KIND.OWNER_ACCESS_CHECK_FAILED,
    );

    expect(resolveFinding).not.toHaveBeenCalled();
  });

  it('throws when the open finding cannot be resolved', async () => {
    vi.mocked(resolveFinding).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    await expect(
      resolveOpenFinding(MOCK_TENANT_ID, FINDING_KIND.DOCUMENT_CAP_APPROACHING),
    ).rejects.toThrow(/could not be resolved/);
  });
});
