import { TENANT_ACTIVITY_TOUCH_FAILED_EVENT } from '@web/constants/revalidate';
import { DEFAULT_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { recordTenantActivity } from './record-tenant-activity';

const { touchTenantActivityMock } = vi.hoisted(() => ({
  touchTenantActivityMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { tenants: { touchTenantActivity: touchTenantActivityMock } },
}));

vi.mock('@web/utils/logger/logger');

const loggerErrorMock = vi.mocked(logger.error);

const AT = new Date('2026-10-21T12:00:00.000Z');

describe(recordTenantActivity, () => {
  beforeEach(() => {
    touchTenantActivityMock.mockReset();
    loggerErrorMock.mockReset();
  });

  it("moves the tenant's last activity to the given time", async () => {
    touchTenantActivityMock.mockResolvedValue({
      ok: true,
      data: { id: DEFAULT_TENANT_ID },
    });

    await recordTenantActivity(DEFAULT_TENANT_ID, AT);

    expect(touchTenantActivityMock).toHaveBeenCalledWith(DEFAULT_TENANT_ID, AT);
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('logs and resolves when the update throws', async () => {
    const error = new Error('connection terminated');
    touchTenantActivityMock.mockRejectedValue(error);

    await expect(
      recordTenantActivity(DEFAULT_TENANT_ID, AT),
    ).resolves.toBeUndefined();

    expect(loggerErrorMock).toHaveBeenCalledWith(
      TENANT_ACTIVITY_TOUCH_FAILED_EVENT,
      { tenantId: DEFAULT_TENANT_ID, error },
    );
  });
});
