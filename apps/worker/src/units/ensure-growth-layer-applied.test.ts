import { SITE_TYPE } from '@shinefold/config/constants';
import { getTenantById } from '@shinefold/db/queries/tenants';
import { GROWTH_LAYER_LOG } from '@worker/constants/growth-layer';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { applyGrowthLayer } from '@worker/steps/apply-growth-layer';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import { MOCK_TENANT_ID, mockTenant } from '@worker/testing/tenant/fixtures';
import { atStepAttempt } from '@worker/testing/workflow/step-attempt';
import { isGrowthLayerEntitled } from '@worker/utils/growth-layer/growth-layer-entitlement';
import { logger } from '@worker/utils/logger/logger';
import { createTenantWriteClient } from '@worker/utils/tenant-content/tenant-write-client';
import { FatalError } from 'workflow';

import { ensureGrowthLayerApplied } from './ensure-growth-layer-applied';

vi.mock('@shinefold/db/queries/tenants');
vi.mock('@worker/steps/apply-growth-layer');
vi.mock('@worker/utils/growth-layer/growth-layer-entitlement');
vi.mock('@worker/utils/tenant-content/tenant-write-client');
vi.mock('workflow');

const MOCK_TENANT = mockTenant({ siteType: SITE_TYPE.PORTFOLIO });
const MOCK_CLIENT = {} as Awaited<ReturnType<typeof createTenantWriteClient>>;

const applyLayer = vi.fn();

describe(ensureGrowthLayerApplied, () => {
  beforeEach(() => {
    atStepAttempt(1);
    vi.mocked(getTenantById).mockResolvedValue(MOCK_TENANT);
    vi.mocked(isGrowthLayerEntitled).mockResolvedValue(true);
    vi.mocked(createTenantWriteClient).mockResolvedValue(MOCK_CLIENT);
    vi.mocked(applyGrowthLayer).mockReturnValue(applyLayer);
    applyLayer.mockResolvedValue(undefined);
  });

  it("applies the site type's Growth layer to the tenant's dataset when it is entitled", async () => {
    await ensureGrowthLayerApplied(MOCK_TENANT_ID);

    expect(isGrowthLayerEntitled).toHaveBeenCalledWith(MOCK_TENANT);
    expect(applyGrowthLayer).toHaveBeenCalledWith({
      siteType: SITE_TYPE.PORTFOLIO,
      locale: MOCK_TENANT.locale,
    });
    expect(createTenantWriteClient).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(applyLayer).toHaveBeenCalledWith(MOCK_CLIENT);
  });

  it('writes nothing when the tenant is no longer entitled to the layer', async () => {
    vi.mocked(isGrowthLayerEntitled).mockResolvedValue(false);

    await ensureGrowthLayerApplied(MOCK_TENANT_ID);

    expect(createTenantWriteClient).not.toHaveBeenCalled();
    expect(applyLayer).not.toHaveBeenCalled();
  });

  it('fails for good and logs it when the tenant does not exist', async () => {
    vi.mocked(getTenantById).mockResolvedValue(undefined);

    await expect(ensureGrowthLayerApplied(MOCK_TENANT_ID)).rejects.toThrow(
      FatalError,
    );

    expect(applyLayer).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      GROWTH_LAYER_LOG.APPLY_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });

  it('rethrows a transient failure silently before the final attempt', async () => {
    applyLayer.mockRejectedValue(new Error(MOCK_SANITY_OUTAGE));

    await expect(ensureGrowthLayerApplied(MOCK_TENANT_ID)).rejects.toThrow(
      MOCK_SANITY_OUTAGE,
    );

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs a failure once its retries are spent', async () => {
    atStepAttempt(PROVISIONING_UNIT_MAX_RETRIES + 1);
    applyLayer.mockRejectedValue(new Error(MOCK_SANITY_OUTAGE));

    await expect(ensureGrowthLayerApplied(MOCK_TENANT_ID)).rejects.toThrow(
      MOCK_SANITY_OUTAGE,
    );

    expect(logger.error).toHaveBeenCalledWith(GROWTH_LAYER_LOG.APPLY_FAILED, {
      tenantId: MOCK_TENANT_ID,
      error: MOCK_SANITY_OUTAGE,
    });
  });
});
