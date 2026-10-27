import {
  ACTION_OUTCOME,
  EMAIL_TEMPLATE_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { queries } from '@blog/db';
import { sendEmail } from '@blog/email';
import type * as BlogEmail from '@blog/email';
import { faker } from '@faker-js/faker';
import { EMAIL_TEST_LOG } from '@platform/constants/email-test';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { MOCK_OPERATOR_SESSION } from '@platform/testing/admins/operator';
import { mockedAuth } from '@platform/testing/auth/mocked-auth';
import {
  mockEmailBodyWithLink,
  mockEmailBodyWithText,
  mockEmailConfig,
  mockEmailTemplateResult,
  MOCK_TEST_EMAIL_SENDS_PER_WINDOW,
} from '@platform/testing/email/fixtures';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

import {
  sendTestEmailAction,
  type TSendTestEmailInput,
} from './send-test-email-action';

vi.mock('@blog/db', () => ({
  queries: {
    emailConfig: { getEmailConfig: vi.fn() },
    emailTemplates: { getEmailTemplate: vi.fn() },
    siteConfig: { getSiteConfig: vi.fn() },
  },
}));

vi.mock('@blog/email', async (importOriginal) => ({
  ...(await importOriginal<typeof BlogEmail>()),
  sendEmail: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');
vi.mock('@platform/server/auth/auth');
vi.mock('@platform/utils/env/env');

faker.seed(5998);

const MOCK_ALERT_ADDRESS = faker.internet.email();
const MOCK_REPLY_TO_ADDRESS = faker.internet.email();
const MOCK_SENDER_NAME = faker.lorem.words(2);
const MOCK_SUBJECT = faker.lorem.sentence();
const MOCK_BODY_TEXT = faker.lorem.word();
const MOCK_JAVASCRIPT_HREF = 'javascript:x';

const INPUT: TSendTestEmailInput = {
  templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
  copy: { subject: MOCK_SUBJECT, body: mockEmailBodyWithText(MOCK_BODY_TEXT) },
  sender: {
    senderName: MOCK_SENDER_NAME,
    replyToAddress: MOCK_REPLY_TO_ADDRESS,
    footerPostalAddress: faker.location.streetAddress(),
  },
};

const signInNewAdmin = () => {
  const user = { id: faker.string.uuid(), email: faker.internet.email() };
  mockedAuth.mockResolvedValue({ ...MOCK_OPERATOR_SESSION, user });

  return user;
};

describe(sendTestEmailAction, () => {
  beforeEach(() => {
    Object.assign(env, {
      OPERATOR_ALERT_FROM_ADDRESS: `Alerts <${MOCK_ALERT_ADDRESS}>`,
    });
    vi.mocked(queries.emailConfig.getEmailConfig).mockResolvedValue(
      mockEmailConfig(),
    );
    vi.mocked(queries.emailTemplates.getEmailTemplate).mockResolvedValue(
      mockEmailTemplateResult(),
    );
    vi.mocked(sendEmail).mockReset();
    vi.mocked(sendEmail).mockResolvedValue(undefined);
  });

  it('emails the draft to the signed-in admin, marked as a test', async () => {
    const admin = signInNewAdmin();
    const testSubject = makeEnTranslator('emailPreview')('testSubject', {
      subject: MOCK_SUBJECT,
    });

    const result = await sendTestEmailAction(MOCK_TENANT_ID, INPUT);

    const [email] = vi.mocked(sendEmail).mock.calls.map(([input]) => input);
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      to: admin.email,
    });
    expect(requireTenantMembership).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(email?.to).toBe(admin.email);
    expect(email?.subject).toBe(testSubject);
    expect(email?.replyTo).toBe(MOCK_REPLY_TO_ADDRESS);
    expect(email?.from).toBe(`${MOCK_SENDER_NAME} <${MOCK_ALERT_ADDRESS}>`);
    expect(email?.html).toContain(MOCK_BODY_TEXT);
  });

  it('refuses without sending once the admin hits the limit', async () => {
    signInNewAdmin();

    const results = [];
    for (let send = 0; send <= MOCK_TEST_EMAIL_SENDS_PER_WINDOW; send += 1) {
      results.push(await sendTestEmailAction(MOCK_TENANT_ID, INPUT));
    }

    expect(results.at(-1)).toEqual({ outcome: ACTION_OUTCOME.RATE_LIMITED });
    expect(sendEmail).toHaveBeenCalledTimes(MOCK_TEST_EMAIL_SENDS_PER_WINDOW);
  });

  it('rejects a blank subject without reaching the tenant gate', async () => {
    const result = await sendTestEmailAction(MOCK_TENANT_ID, {
      ...INPUT,
      copy: { ...INPUT.copy, subject: null },
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembership).not.toHaveBeenCalled();
  });

  it('rejects a body carrying an unsafe link', async () => {
    const result = await sendTestEmailAction(MOCK_TENANT_ID, {
      ...INPUT,
      copy: {
        ...INPUT.copy,
        body: mockEmailBodyWithLink(MOCK_JAVASCRIPT_HREF),
      },
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('reports and logs a failed send without throwing', async () => {
    signInNewAdmin();
    const sendError = new Error(faker.lorem.sentence());
    vi.mocked(sendEmail).mockRejectedValue(sendError);

    const result = await sendTestEmailAction(MOCK_TENANT_ID, INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(EMAIL_TEST_LOG.SEND_FAILED, {
      tenantId: MOCK_TENANT_ID,
      templateType: INPUT.templateType,
      errorName: sendError.name,
    });
  });

  it('propagates the tenant gate when the session has no membership', async () => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(sendTestEmailAction(MOCK_TENANT_ID, INPUT)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(sendEmail).not.toHaveBeenCalled();
  });
});
