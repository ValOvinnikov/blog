import { sendEmail } from '@blog/email';
import { faker } from '@faker-js/faker';
import { CREATE_SITE_GATE_LOG } from '@platform/constants/create-site-gate';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { logger } from '@platform/utils/logger/logger';

import { alertSelfServeLimit } from './alert-self-serve-limit';

faker.seed(5998);

const { listSuperadminEmails } = vi.hoisted(() => ({
  listSuperadminEmails: vi.fn(),
}));

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { admins: { listSuperadminEmails } },
}));

vi.mock('@blog/email', () => ({
  buildSelfServeLimitAlertEmail: () => MOCK_ALERT_EMAIL,
  sendEmail: vi.fn(),
}));

const MOCK_ALERT_EMAIL = {
  subject: faker.lorem.sentence(),
  html: `<p>${faker.lorem.sentence()}</p>`,
};
const MOCK_DAY = faker.date
  .past({ refDate: '2026-10-21T09:00:00Z' })
  .toISOString()
  .slice(0, 10);
const MOCK_DAILY_LIMIT = faker.number.int({ min: 10, max: 100 });
const MOCK_OPERATOR_EMAIL = faker.internet.email();
const MOCK_SECOND_OPERATOR_EMAIL = faker.internet.email();

describe(alertSelfServeLimit, () => {
  beforeEach(() => {
    listSuperadminEmails.mockReset();
    listSuperadminEmails.mockResolvedValue([MOCK_OPERATOR_EMAIL]);
    vi.mocked(sendEmail).mockReset();
    vi.mocked(sendEmail).mockResolvedValue(undefined);
  });

  it('emails every super admin the limit alert', async () => {
    listSuperadminEmails.mockResolvedValue([
      MOCK_OPERATOR_EMAIL,
      MOCK_SECOND_OPERATOR_EMAIL,
    ]);

    await alertSelfServeLimit(MOCK_DAY, MOCK_DAILY_LIMIT);

    const sentEmails = vi.mocked(sendEmail).mock.calls.map(([input]) => input);
    expect(sentEmails.map(({ to }) => to)).toEqual([
      MOCK_OPERATOR_EMAIL,
      MOCK_SECOND_OPERATOR_EMAIL,
    ]);
    expect(sentEmails.map(({ subject, html }) => ({ subject, html }))).toEqual([
      MOCK_ALERT_EMAIL,
      MOCK_ALERT_EMAIL,
    ]);
  });

  it('sends nothing and warns when there are no super admins', async () => {
    listSuperadminEmails.mockResolvedValue([]);

    await alertSelfServeLimit(MOCK_DAY, MOCK_DAILY_LIMIT);

    expect(sendEmail).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      CREATE_SITE_GATE_LOG.ALERT_NO_RECIPIENTS,
      { day: MOCK_DAY },
    );
  });

  it('logs a failed send without throwing', async () => {
    const sendError = new Error(faker.lorem.sentence());
    vi.mocked(sendEmail).mockRejectedValue(sendError);

    await expect(
      alertSelfServeLimit(MOCK_DAY, MOCK_DAILY_LIMIT),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      CREATE_SITE_GATE_LOG.ALERT_SEND_FAILED,
      { day: MOCK_DAY, errorName: sendError.name },
    );
  });

  it('logs a failed recipient lookup without throwing', async () => {
    const lookupError = new Error(faker.lorem.sentence());
    listSuperadminEmails.mockRejectedValue(lookupError);

    await expect(
      alertSelfServeLimit(MOCK_DAY, MOCK_DAILY_LIMIT),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      CREATE_SITE_GATE_LOG.ALERT_FAILED,
      { day: MOCK_DAY, errorName: lookupError.name },
    );
  });
});
