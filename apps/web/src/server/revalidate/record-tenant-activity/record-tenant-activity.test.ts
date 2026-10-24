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

const loggerErrorMock = vi.mocked(logger.error);

const AT = faker.date.recent();

describe(recordTenantActivity, () => {
  beforeEach(() => {
    touchTenantActivityMock.mockReset();
    loggerErrorMock.mockReset();
  });

  it("moves the tenant's last activity to the given time", async () => {
    touchTenantActivityMock.mockResolvedValue(okResult({ id: MOCK_TENANT_ID }));

    await recordTenantActivity(MOCK_TENANT_ID, AT);

    expect(touchTenantActivityMock).toHaveBeenCalledWith(MOCK_TENANT_ID, AT);
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
    touchTenantActivityMock.mockImplementation(touch);

    await expect(
      recordTenantActivity(MOCK_TENANT_ID, AT),
    ).resolves.toBeUndefined();

    expect(loggerErrorMock).toHaveBeenCalledWith(
      REVALIDATE_LOG.TENANT_ACTIVITY_TOUCH_FAILED,
      { tenantId: MOCK_TENANT_ID, error },
    );
  });
});
