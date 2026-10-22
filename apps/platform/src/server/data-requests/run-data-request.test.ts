import { ACTION_OUTCOME, AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import { DATA_REQUEST_FIELD_ERROR } from '@platform/constants/data-request';
import { firstRecordedAuditEvent } from '@platform/testing/audit-events/recorded-audit-event';
import {
  DATA_REQUEST_EMAIL,
  DATA_REQUEST_EMAIL_INDEX,
  makePersonalDataMatches,
  NOT_AN_EMAIL,
  ONE_OF_EACH_COUNT,
} from '@platform/testing/data-requests/fixtures';
import { logger } from '@platform/utils/logger/logger';

import { runDataRequest } from './run-data-request';
import { countPersonalDataMatches } from './to-data-request-matches';

const { recordAuditEventMock, runMock } = vi.hoisted(() => ({
  recordAuditEventMock: vi.fn(),
  runMock: vi.fn(),
}));

vi.mock('@platform/server/audit/record-audit-event', () => ({
  recordAuditEvent: recordAuditEventMock,
}));

const STEP = {
  run: runMock,
  action: AUDIT_ACTION.PERSONAL_DATA_LOOKED_UP,
  auditDetails: countPersonalDataMatches,
};

const INVALID_EMAIL = {
  ok: false,
  error: {
    outcome: ACTION_OUTCOME.INVALID,
    fieldErrors: {
      email: { reason: DATA_REQUEST_FIELD_ERROR.EMAIL_INVALID },
    },
  },
};

const SERVER_ERROR = {
  ok: false,
  error: { outcome: ACTION_OUTCOME.SERVER_ERROR },
};

describe(runDataRequest, () => {
  beforeEach(() => {
    recordAuditEventMock.mockReset();
    runMock
      .mockReset()
      .mockResolvedValue({ ok: true, data: makePersonalDataMatches() });
    vi.mocked(logger.error).mockReset();
  });

  it('runs the request for the trimmed email and returns its data', async () => {
    const result = await runDataRequest(
      { email: ` ${DATA_REQUEST_EMAIL} ` },
      STEP,
    );

    expect(runMock).toHaveBeenCalledWith(DATA_REQUEST_EMAIL);
    expect(result).toEqual({ ok: true, data: makePersonalDataMatches() });
  });

  it("audits the request against the email's index with only counts", async () => {
    await runDataRequest({ email: DATA_REQUEST_EMAIL }, STEP);

    expect(firstRecordedAuditEvent(recordAuditEventMock)).toEqual({
      action: AUDIT_ACTION.PERSONAL_DATA_LOOKED_UP,
      targetType: AUDIT_TARGET_TYPE.PERSONAL_DATA,
      targetId: DATA_REQUEST_EMAIL_INDEX,
      details: ONE_OF_EACH_COUNT,
    });
  });

  it('refuses a value that is not an email without running or auditing', async () => {
    const result = await runDataRequest({ email: NOT_AN_EMAIL }, STEP);

    expect(result).toEqual(INVALID_EMAIL);
    expect(runMock).not.toHaveBeenCalled();
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it('reports an email the data layer rejects as invalid', async () => {
    runMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_INVALID_EMAIL,
    });

    const result = await runDataRequest({ email: DATA_REQUEST_EMAIL }, STEP);

    expect(result).toEqual(INVALID_EMAIL);
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns a server error and logs when the request fails', async () => {
    runMock.mockResolvedValue({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });

    const result = await runDataRequest({ email: DATA_REQUEST_EMAIL }, STEP);
    const [, context] = vi.mocked(logger.error).mock.calls[0] ?? [];

    expect(result).toEqual(SERVER_ERROR);
    expect(context).toEqual({
      action: AUDIT_ACTION.PERSONAL_DATA_LOOKED_UP,
      error: ERROR_CODE.DB_NOT_FOUND,
    });
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns a server error without an audit event when the request throws', async () => {
    runMock.mockRejectedValue(new Error('db down'));

    const result = await runDataRequest({ email: DATA_REQUEST_EMAIL }, STEP);

    expect(result).toEqual(SERVER_ERROR);
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });
});
