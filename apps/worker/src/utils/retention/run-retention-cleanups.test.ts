import {
  deleteAuditEventsPastRetention,
  deleteExpiredSessions,
  deleteExpiredVerificationTokens,
  deleteLeadsPastRetention,
  deletePendingSubscribersPastRetention,
  deleteResolvedFindingsPastRetention,
} from '@blog/db/queries/retention';
import {
  RETENTION_DELETE_BATCH_SIZE,
  RETENTION_KIND,
  RETENTION_LOG,
} from '@worker/constants/retention';
import { MOCK_NOW } from '@worker/testing/clock/frozen-clock';
import { MOCK_DB_DOWN } from '@worker/testing/outage/fixtures';
import { logger } from '@worker/utils/logger/logger';

import { runRetentionCleanups } from './run-retention-cleanups';

vi.mock('@blog/db/queries/retention');

const ALL_CLEANUPS = [
  deletePendingSubscribersPastRetention,
  deleteLeadsPastRetention,
  deleteExpiredSessions,
  deleteExpiredVerificationTokens,
  deleteAuditEventsPastRetention,
  deleteResolvedFindingsPastRetention,
];

describe(runRetentionCleanups, () => {
  beforeEach(() => {
    for (const cleanup of ALL_CLEANUPS) vi.mocked(cleanup).mockResolvedValue(0);
  });

  it('runs every cleanup for now and logs one line with the count per kind', async () => {
    vi.mocked(deleteLeadsPastRetention).mockResolvedValue(3);
    vi.mocked(deleteExpiredSessions).mockResolvedValue(7);

    const deleted = await runRetentionCleanups(MOCK_NOW);

    const expected = {
      [RETENTION_KIND.PENDING_SUBSCRIBERS]: 0,
      [RETENTION_KIND.LEADS]: 3,
      [RETENTION_KIND.SESSIONS]: 7,
      [RETENTION_KIND.VERIFICATION_TOKENS]: 0,
      [RETENTION_KIND.AUDIT_EVENTS]: 0,
      [RETENTION_KIND.RESOLVED_FINDINGS]: 0,
    };
    expect(deleted).toEqual(expected);
    for (const cleanup of ALL_CLEANUPS) {
      expect(cleanup).toHaveBeenCalledWith(
        MOCK_NOW,
        RETENTION_DELETE_BATCH_SIZE,
      );
    }
    expect(logger.info).toHaveBeenCalledExactlyOnceWith(RETENTION_LOG.DELETED, {
      deleted: expected,
    });
  });

  it('keeps deleting in batches until a batch comes back short', async () => {
    vi.mocked(deleteAuditEventsPastRetention)
      .mockResolvedValueOnce(RETENTION_DELETE_BATCH_SIZE)
      .mockResolvedValueOnce(RETENTION_DELETE_BATCH_SIZE)
      .mockResolvedValueOnce(2);

    const deleted = await runRetentionCleanups(MOCK_NOW);

    expect(deleteAuditEventsPastRetention).toHaveBeenCalledTimes(3);
    expect(deleted[RETENTION_KIND.AUDIT_EVENTS]).toBe(
      RETENTION_DELETE_BATCH_SIZE * 2 + 2,
    );
  });

  it('logs a failing cleanup and still runs the others', async () => {
    vi.mocked(deleteLeadsPastRetention).mockRejectedValue(
      new Error(MOCK_DB_DOWN),
    );
    vi.mocked(deleteResolvedFindingsPastRetention).mockResolvedValue(5);

    const deleted = await runRetentionCleanups(MOCK_NOW);

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      RETENTION_LOG.CLEANUP_FAILED,
      { kind: RETENTION_KIND.LEADS, error: MOCK_DB_DOWN },
    );
    expect(deleted).not.toHaveProperty(RETENTION_KIND.LEADS);
    expect(deleted[RETENTION_KIND.RESOLVED_FINDINGS]).toBe(5);
  });
});
