import {
  GROWTH_LAYER_LOG,
  GROWTH_LAYER_PATH,
} from '@platform/constants/growth-layer';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { HTTP_STATUS } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';

import { enqueueGrowthLayerOnUpgrade } from './enqueue-growth-layer-on-upgrade';

vi.mock('@platform/server/provisioning/enqueue-provisioning');

const enqueueWorkerRequestMock = vi.mocked(enqueueWorkerRequest);

const { FREE, STARTER, GROWTH } = TENANT_PLAN;

describe(enqueueGrowthLayerOnUpgrade, () => {
  it.each([FREE, STARTER])(
    'asks the worker to apply the Growth layer on a move from %s to Growth',
    async (fromPlan) => {
      enqueueWorkerRequestMock.mockResolvedValueOnce(HTTP_STATUS.ACCEPTED);

      await enqueueGrowthLayerOnUpgrade(MOCK_TENANT_ID, fromPlan, GROWTH);

      expect(enqueueWorkerRequestMock).toHaveBeenCalledWith(
        GROWTH_LAYER_PATH.APPLY,
        { tenantId: MOCK_TENANT_ID },
      );
      expect(logger.error).not.toHaveBeenCalled();
    },
  );

  it.each([
    [FREE, STARTER],
    [GROWTH, STARTER],
    [GROWTH, FREE],
    [GROWTH, GROWTH],
  ])('asks nothing on a move from %s to %s', async (fromPlan, toPlan) => {
    await enqueueGrowthLayerOnUpgrade(MOCK_TENANT_ID, fromPlan, toPlan);

    expect(enqueueWorkerRequestMock).not.toHaveBeenCalled();
  });

  it('stays silent when the worker has no provisioned site to apply it to yet', async () => {
    enqueueWorkerRequestMock.mockResolvedValueOnce(HTTP_STATUS.CONFLICT);

    await enqueueGrowthLayerOnUpgrade(MOCK_TENANT_ID, STARTER, GROWTH);

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs a request the worker rejects', async () => {
    enqueueWorkerRequestMock.mockResolvedValueOnce(HTTP_STATUS.BAD_REQUEST);

    await enqueueGrowthLayerOnUpgrade(MOCK_TENANT_ID, STARTER, GROWTH);

    expect(logger.error).toHaveBeenCalledWith(
      GROWTH_LAYER_LOG.APPLY_ENQUEUE_REJECTED,
      { tenantId: MOCK_TENANT_ID, responseStatus: HTTP_STATUS.BAD_REQUEST },
    );
  });

  it('leaves an unreachable worker to the request it already logged', async () => {
    enqueueWorkerRequestMock.mockResolvedValueOnce(null);

    await enqueueGrowthLayerOnUpgrade(MOCK_TENANT_ID, STARTER, GROWTH);

    expect(logger.error).not.toHaveBeenCalled();
  });
});
