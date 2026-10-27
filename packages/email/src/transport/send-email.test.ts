import { LIST_UNSUBSCRIBE_ONE_CLICK } from '@blog/email/templates/tenant/newsletter-confirmation/newsletter-confirmation';
import {
  MOCK_BODY_HTML,
  MOCK_EMAIL_ADDRESS,
  MOCK_EMAIL_SUBJECT,
  MOCK_INVALID_EMAIL_ADDRESS,
  MOCK_RESEND_API_KEY,
  MOCK_URL,
} from '@blog/email/testing/email-fixtures';
import { faker } from '@faker-js/faker';

import { sendEmail, type TSendEmailInput } from './send-email';

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

const MOCK_EMAIL: TSendEmailInput = {
  to: faker.internet.email(),
  from: `${faker.company.name()} <${faker.internet.email()}>`,
  subject: MOCK_EMAIL_SUBJECT,
  html: MOCK_BODY_HTML,
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
    vi.stubEnv('RESEND_API_KEY', MOCK_RESEND_API_KEY);
    sendMock.mockResolvedValue({
      data: { id: faker.string.uuid() },
      error: null,
    });
    send = await importFreshSendEmail();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sends the given email through the Resend client', async () => {
    await send(MOCK_EMAIL);

    expect(sendMock).toHaveBeenCalledWith(MOCK_EMAIL);
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
  ])('forwards %s to the Resend client', async (_name, extra) => {
    await send({ ...MOCK_EMAIL, ...extra });

    expect(sendMock).toHaveBeenCalledWith({ ...MOCK_EMAIL, ...extra });
  });

  it.each(['headers', 'replyTo'] as const)(
    'sends no %s when none are supplied',
    async (key) => {
      await send(MOCK_EMAIL);

      expect(sentEmail()?.[key]).toBeUndefined();
    },
  );

  it('constructs the Resend client with the configured API key', async () => {
    await send(MOCK_EMAIL);

    expect(resendCtorMock).toHaveBeenCalledWith(MOCK_RESEND_API_KEY);
  });

  it('reuses a single Resend client across sends', async () => {
    await send(MOCK_EMAIL);
    await send({ ...MOCK_EMAIL, to: faker.internet.email() });

    expect(resendCtorMock).toHaveBeenCalledTimes(1);
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
