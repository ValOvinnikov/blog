import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  NEWSLETTER_PAUSE_LOG,
  NEWSLETTER_PAUSE_REFUSAL,
} from '@platform/constants/newsletter-pause';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { firstRecordedAuditEvent } from '@platform/testing/audit-events/recorded-audit-event';
import { MOCK_NEWSLETTER_PAUSED_AT } from '@platform/testing/email/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  mockTenant,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { notFound } from 'next/navigation';

import { clearNewsletterPauseAction } from './clear-newsletter-pause-action';

faker.seed(7254);

const {
  requireTenantByIdMock,
  clearNewsletterPauseMock,
  recordAuditEventMock,
} = vi.hoisted(() => ({
  requireTenantByIdMock: vi.fn(),
  clearNewsletterPauseMock: vi.fn(),
  recordAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin');

vi.mock('@platform/server/auth/require-tenant-by-id', () => ({
  requireTenantById: requireTenantByIdMock,
}));

vi.mock('@platform/server/audit/record-audit-event', () => ({
  recordAuditEvent: recordAuditEventMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    emailConfig: { clearNewsletterPause: clearNewsletterPauseMock },
  },
}));

const MOCK_DB_ERROR = new Error(faker.lorem.sentence());
const NOT_PAUSED_RESULT = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: NEWSLETTER_PAUSE_REFUSAL.NOT_PAUSED,
};

describe(clearNewsletterPauseAction, () => {
  beforeEach(() => {
    requireTenantByIdMock.mockReset().mockResolvedValue({
      tenant: mockTenant({ id: MOCK_TENANT_ID, name: MOCK_TENANT_NAME }),
    });
    clearNewsletterPauseMock
      .mockReset()
      .mockResolvedValue(MOCK_NEWSLETTER_PAUSED_AT);
    recordAuditEventMock.mockReset();
  });

  it('refuses a caller who is not a super admin, such as a moderator', async () => {
    vi.mocked(requireSuperAdmin).mockImplementationOnce(() => {
      notFound();
    });

    await expect(clearNewsletterPauseAction(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(clearNewsletterPauseMock).not.toHaveBeenCalled();
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it('refuses an id that is not a tenant id without touching the pause', async () => {
    const result = await clearNewsletterPauseAction(faker.lorem.word());

    expect(result).toEqual(NOT_PAUSED_RESULT);
    expect(clearNewsletterPauseMock).not.toHaveBeenCalled();
  });

  it('clears the pause and audits it with the time the write cleared', async () => {
    const result = await clearNewsletterPauseAction(MOCK_TENANT_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(clearNewsletterPauseMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(firstRecordedAuditEvent(recordAuditEventMock)).toEqual({
      action: AUDIT_ACTION.NEWSLETTER_PAUSE_CLEARED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: {
        name: MOCK_TENANT_NAME,
        pausedAt: MOCK_NEWSLETTER_PAUSED_AT.toISOString(),
      },
    });
  });

  it('refuses a second caller whose clear found no pause, and records nothing', async () => {
    clearNewsletterPauseMock.mockResolvedValue(undefined);

    const result = await clearNewsletterPauseAction(MOCK_TENANT_ID);

    expect(result).toEqual(NOT_PAUSED_RESULT);
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns a server error without an audit event when the clear fails', async () => {
    clearNewsletterPauseMock.mockRejectedValue(MOCK_DB_ERROR);

    const result = await clearNewsletterPauseAction(MOCK_TENANT_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      NEWSLETTER_PAUSE_LOG.CLEAR_FAILED,
      { tenantId: MOCK_TENANT_ID, errorName: MOCK_DB_ERROR.name },
    );
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });
});
