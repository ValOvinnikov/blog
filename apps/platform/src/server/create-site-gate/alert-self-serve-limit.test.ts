import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { logger } from '@platform/utils/logger/logger';

import { alertSelfServeLimit } from './alert-self-serve-limit';

const { listSuperadminEmailsMock, sendEmailMock, ALERT_EMAIL } = vi.hoisted(
  () => ({
    listSuperadminEmailsMock: vi.fn(),
    sendEmailMock: vi.fn(),
    ALERT_EMAIL: { subject: 'Daily limit reached', html: '<p>Limit</p>' },
  }),
);

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { listSuperadminEmails: listSuperadminEmailsMock },
  },
}));

vi.mock('@blog/email', () => ({
  buildSelfServeLimitAlertEmail: () => ALERT_EMAIL,
  sendEmail: sendEmailMock,
}));

const DAY = '2026-11-02';
const DAILY_LIMIT = 50;
const OPERATOR = 'ops@example.com';
const SECOND_OPERATOR = 'oncall@example.com';

const loggerErrorMock = vi.mocked(logger.error);

describe('alertSelfServeLimit', () => {
  beforeEach(() => {
    listSuperadminEmailsMock.mockReset().mockResolvedValue([OPERATOR]);
    sendEmailMock.mockReset().mockResolvedValue(undefined);
    loggerErrorMock.mockReset();
  });

  it('emails every super admin', async () => {
    listSuperadminEmailsMock.mockResolvedValue([OPERATOR, SECOND_OPERATOR]);

    await alertSelfServeLimit(DAY, DAILY_LIMIT);

    expect(sendEmailMock).toHaveBeenCalledTimes(2);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: OPERATOR, ...ALERT_EMAIL }),
    );
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: SECOND_OPERATOR }),
    );
  });

  it('sends nothing when there are no super admins', async () => {
    listSuperadminEmailsMock.mockResolvedValue([]);

    await alertSelfServeLimit(DAY, DAILY_LIMIT);

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('logs a failed send without throwing', async () => {
    sendEmailMock.mockRejectedValue(new Error('resend down'));

    await expect(
      alertSelfServeLimit(DAY, DAILY_LIMIT),
    ).resolves.toBeUndefined();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ day: DAY }),
    );
  });

  it('logs a failed recipient lookup without throwing', async () => {
    listSuperadminEmailsMock.mockRejectedValue(new Error('db down'));

    await expect(
      alertSelfServeLimit(DAY, DAILY_LIMIT),
    ).resolves.toBeUndefined();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ day: DAY }),
    );
  });
});
