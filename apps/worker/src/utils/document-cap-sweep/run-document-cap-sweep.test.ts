import { listActiveTenants } from '@shinefold/db/queries/tenants';
import {
  DOCUMENT_CAP_CHECK,
  DOCUMENT_CAP_LOG,
} from '@worker/constants/document-cap';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import {
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';

import { checkTenantDocumentCap } from './check-tenant-document-cap';
import { runDocumentCapSweep } from './run-document-cap-sweep';

vi.mock('@shinefold/db/queries/tenants');
vi.mock('./check-tenant-document-cap');

const MOCK_OTHER_TENANT_ID = 'tenant-other';
const MOCK_THIRD_TENANT_ID = 'tenant-third';

describe(runDocumentCapSweep, () => {
  beforeEach(() => {
    vi.mocked(listActiveTenants).mockResolvedValue([
      mockProvisionedTenant(),
      mockProvisionedTenant({ id: MOCK_OTHER_TENANT_ID }),
      mockProvisionedTenant({ id: MOCK_THIRD_TENANT_ID }),
    ]);
  });

  it('checks every active tenant and counts the ones nearing the cap, leaving skipped ones out', async () => {
    vi.mocked(checkTenantDocumentCap)
      .mockResolvedValueOnce(DOCUMENT_CAP_CHECK.NEARING)
      .mockResolvedValueOnce(DOCUMENT_CAP_CHECK.CLEAR)
      .mockResolvedValueOnce(DOCUMENT_CAP_CHECK.SKIPPED);

    const result = await runDocumentCapSweep();

    expect(checkTenantDocumentCap).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ checked: 2, nearing: 1, failed: 0 });
  });

  it('logs a tenant it cannot check and carries on with the rest', async () => {
    vi.mocked(checkTenantDocumentCap)
      .mockRejectedValueOnce(new Error(MOCK_SANITY_OUTAGE))
      .mockResolvedValue(DOCUMENT_CAP_CHECK.CLEAR);

    const result = await runDocumentCapSweep();

    expect(result).toEqual({ checked: 2, nearing: 0, failed: 1 });
    expect(logger.error).toHaveBeenCalledWith(
      DOCUMENT_CAP_LOG.SWEEP_TENANT_FAILED,
      { tenantId: MOCK_TENANT_ID, error: MOCK_SANITY_OUTAGE },
    );
  });
});
