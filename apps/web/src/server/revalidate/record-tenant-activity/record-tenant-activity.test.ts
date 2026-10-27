import { ERROR_CODE } from '@blog/config/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { recordTenantActivity } from './record-tenant-activity';

const { touchTenantActivityMock } = vi.hoisted(() => ({
  touchTenantActivityMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { tenants: { touchTenantActivity: touchTenantActivityMock } },
}));

faker.seed(5722);

const loggerErrorMock = vi.mocked(logger.error);

const MOCK_ACTIVITY_AT = faker.date.recent();

describe(recordTenantActivity, () => {
  it("moves the tenant's last activity to the given time", async () => {
    touchTenantActivityMock.mockResolvedValueOnce(
      okResult({ id: MOCK_TENANT_ID }),
    );

    await recordTenantActivity(MOCK_TENANT_ID, MOCK_ACTIVITY_AT);

    expect(touchTenantActivityMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_ACTIVITY_AT,
    );
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it.each([
    ['throws an error', () => Promise.reject(MOCK_ERROR), MOCK_ERROR],
    [
      'returns a failure',
      async () => errorResult(ERROR_CODE.DB_NOT_FOUND),
      ERROR_CODE.DB_NOT_FOUND,
    ],
  ])('logs and resolves when the update %s', async (_, touch, error) => {
    touchTenantActivityMock.mockImplementationOnce(touch);

    await expect(
      recordTenantActivity(MOCK_TENANT_ID, MOCK_ACTIVITY_AT),
    ).resolves.toBeUndefined();

    expect(loggerErrorMock).toHaveBeenCalledWith(
      REVALIDATE_LOG.TENANT_ACTIVITY_TOUCH_FAILED,
      { tenantId: MOCK_TENANT_ID, error },
    );
  });
});
