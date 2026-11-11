import { buildSiteEmailTag } from '@blog/email/tags';
import { LIST_UNSUBSCRIBE_ONE_CLICK } from '@blog/email/templates/tenant/unsubscribe/unsubscribe';
import {
  MOCK_BODY_HTML,
  MOCK_EMAIL_ADDRESS,
  MOCK_EMAIL_SUBJECT,
  MOCK_INVALID_EMAIL_ADDRESS,
  MOCK_RESEND_PLATFORM_API_KEY,
  MOCK_RESEND_TENANT_API_KEY,
  MOCK_TENANT_ID,
  MOCK_URL,
} from '@blog/email/testing/email-fixtures';
import { faker } from '@faker-js/faker';

import { EMAIL_ACCOUNT } from './email-account';
import {
  isEmailAccountConfigured,
  sendEmail,
  type TSendEmailInput,
} from './send-email';

const { sendMock, resendCtorMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  resendCtorMock: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
    constructor(key: string | undefined) {
      resendCtorMock(key);
    }
  },
}));

faker.seed(6026);

const MOCK_RESEND_PAYLOAD = {
  to: faker.internet.email(),
  from: `${faker.company.name()} <${faker.internet.email()}>`,
  subject: MOCK_EMAIL_SUBJECT,
  html: MOCK_BODY_HTML,
};
const MOCK_EMAIL: TSendEmailInput = {
  account: EMAIL_ACCOUNT.TENANT,
  ...MOCK_RESEND_PAYLOAD,
};
const MOCK_RESEND_ERROR_MESSAGE = faker.lorem.sentence();

type TSendEmailModule = typeof import('./send-email');

async function importFreshSendEmail(): Promise<TSendEmailModule['sendEmail']> {
  vi.resetModules();
  const freshModule = await import('./send-email');
  return freshModule.sendEmail;
}

function sentEmail(): Partial<TSendEmailInput> | undefined {
  return sendMock.mock.calls[0]?.[0];
}

describe(sendEmail, () => {
  let send: TSendEmailModule['sendEmail'];

  beforeEach(async () => {
    vi.stubEnv('RESEND_PLATFORM_API_KEY', MOCK_RESEND_PLATFORM_API_KEY);
    vi.stubEnv('RESEND_TENANT_API_KEY', MOCK_RESEND_TENANT_API_KEY);
    sendMock.mockResolvedValue({
      data: { id: faker.string.uuid() },
      error: null,
    });
    send = await importFreshSendEmail();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('for an email with no optional fields', () => {
    beforeEach(async () => {
      await send(MOCK_EMAIL);
    });

    it('sends the given email through the Resend client', () => {
      expect(sendMock).toHaveBeenCalledWith(MOCK_RESEND_PAYLOAD);
    });

    it.each(['headers', 'replyTo', 'tags'] as const)('sends no %s', (key) => {
      expect(sentEmail()?.[key]).toBeUndefined();
    });

    it('reuses a single Resend client across sends', async () => {
      await send({ ...MOCK_EMAIL, to: faker.internet.email() });

      expect(resendCtorMock).toHaveBeenCalledTimes(1);
    });
  });

  it.each([
    [EMAIL_ACCOUNT.PLATFORM, MOCK_RESEND_PLATFORM_API_KEY],
    [EMAIL_ACCOUNT.TENANT, MOCK_RESEND_TENANT_API_KEY],
  ])('sends %s mail with its own API key', async (account, key) => {
    await send({ ...MOCK_EMAIL, account });

    expect(resendCtorMock).toHaveBeenCalledWith(key);
  });

  it('keeps one Resend client per account', async () => {
    await send({ ...MOCK_EMAIL, account: EMAIL_ACCOUNT.PLATFORM });
    await send({ ...MOCK_EMAIL, account: EMAIL_ACCOUNT.TENANT });
    await send({ ...MOCK_EMAIL, account: EMAIL_ACCOUNT.PLATFORM });

    expect(resendCtorMock).toHaveBeenCalledTimes(2);
  });

  describe('with only the tenant key set', () => {
    beforeEach(async () => {
      vi.stubEnv('RESEND_PLATFORM_API_KEY', undefined);
      send = await importFreshSendEmail();
    });

    it('fails platform mail without constructing a Resend client', async () => {
      await expect(
        send({ ...MOCK_EMAIL, account: EMAIL_ACCOUNT.PLATFORM }),
      ).rejects.toThrow(EMAIL_ACCOUNT.PLATFORM);
      expect(resendCtorMock).not.toHaveBeenCalled();
    });

    it('still sends tenant mail', async () => {
      await send({ ...MOCK_EMAIL, account: EMAIL_ACCOUNT.TENANT });

      expect(sendMock).toHaveBeenCalledWith(MOCK_RESEND_PAYLOAD);
    });
  });

  it.each<[string, Partial<TSendEmailInput>]>([
    [
      'custom headers',
      {
        headers: {
          'List-Unsubscribe': `<${MOCK_URL}/unsubscribe>`,
          'List-Unsubscribe-Post': LIST_UNSUBSCRIBE_ONE_CLICK,
        },
      },
    ],
    ['the plain-text alternative', { text: faker.lorem.sentence() }],
    ['a replyTo address', { replyTo: MOCK_EMAIL_ADDRESS }],
    ['tags', { tags: [buildSiteEmailTag(MOCK_TENANT_ID)] }],
  ])('forwards %s to the Resend client', async (_name, extra) => {
    await send({ ...MOCK_EMAIL, ...extra });

    expect(sendMock).toHaveBeenCalledWith({ ...MOCK_RESEND_PAYLOAD, ...extra });
  });

  it('rejects a malformed replyTo address without calling Resend', async () => {
    await expect(
      send({ ...MOCK_EMAIL, replyTo: MOCK_INVALID_EMAIL_ADDRESS }),
    ).rejects.toThrow(Error);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      'Confirm subscription\r\nBcc: attacker@evil.example',
      'Confirm subscription Bcc: attacker@evil.example',
    ],
    ['Line one\nLine two\rLine three', 'Line one Line two Line three'],
  ])('strips line breaks from the subject %j', async (subject, expected) => {
    await send({ ...MOCK_EMAIL, subject });

    expect(sentEmail()?.subject).toBe(expected);
  });

  it('throws with the reason Resend gives for a failed send', async () => {
    sendMock.mockResolvedValueOnce({
      data: null,
      error: { name: 'validation_error', message: MOCK_RESEND_ERROR_MESSAGE },
    });

    await expect(send(MOCK_EMAIL)).rejects.toThrow(MOCK_RESEND_ERROR_MESSAGE);
  });
});

describe(isEmailAccountConfigured, () => {
  type TIsConfigured = TSendEmailModule['isEmailAccountConfigured'];

  async function importFreshIsConfigured(): Promise<TIsConfigured> {
    vi.resetModules();
    const freshModule = await import('./send-email');
    return freshModule.isEmailAccountConfigured;
  }

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    [
      EMAIL_ACCOUNT.PLATFORM,
      'RESEND_PLATFORM_API_KEY',
      MOCK_RESEND_PLATFORM_API_KEY,
    ],
    [EMAIL_ACCOUNT.TENANT, 'RESEND_TENANT_API_KEY', MOCK_RESEND_TENANT_API_KEY],
  ])(
    'reports the %s account configured once its key is set',
    async (account, name, key) => {
      vi.stubEnv(name, key);

      const isConfigured = await importFreshIsConfigured();

      expect(isConfigured(account)).toBe(true);
    },
  );

  it('reports an account without a key as not configured', async () => {
    vi.stubEnv('RESEND_PLATFORM_API_KEY', undefined);
    vi.stubEnv('RESEND_TENANT_API_KEY', MOCK_RESEND_TENANT_API_KEY);

    const isConfigured = await importFreshIsConfigured();

    expect(isConfigured(EMAIL_ACCOUNT.PLATFORM)).toBe(false);
  });
});
