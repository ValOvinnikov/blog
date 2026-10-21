import type { TSendEmailInput } from './send-email';

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

const RESEND_API_KEY = 'test-resend-key';

const EMAIL = {
  to: 'reader@example.com',
  from: 'Sign in <onboarding@resend.dev>',
  subject: 'Sign in to example.com',
  html: '<p>Click to sign in</p>',
};

type TSendEmailModule = typeof import('./send-email');

async function importSendEmail(): Promise<TSendEmailModule> {
  vi.resetModules();
  return import('./send-email');
}

function sentEmail(): Partial<TSendEmailInput> | undefined {
  return sendMock.mock.calls[0]?.[0];
}

describe('sendEmail', () => {
  let sendEmail: TSendEmailModule['sendEmail'];

  beforeEach(async () => {
    sendMock.mockReset();
    resendCtorMock.mockReset();
    process.env['RESEND_API_KEY'] = RESEND_API_KEY;
    sendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null });
    ({ sendEmail } = await importSendEmail());
  });

  it('sends the given email via the Resend client', async () => {
    await sendEmail(EMAIL);

    expect(sendMock).toHaveBeenCalledWith(EMAIL);
  });

  it('forwards custom headers to the Resend client when supplied', async () => {
    const headers = {
      'List-Unsubscribe': '<https://example.com/unsubscribe>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };

    await sendEmail({ ...EMAIL, headers });

    expect(sendMock).toHaveBeenCalledWith({ ...EMAIL, headers });
  });

  it('forwards the plain-text alternative when supplied', async () => {
    const text = 'Click to sign in';

    await sendEmail({ ...EMAIL, text });

    expect(sendMock).toHaveBeenCalledWith({ ...EMAIL, text });
  });

  it('sends no headers when none are supplied', async () => {
    await sendEmail(EMAIL);

    expect(sentEmail()?.headers).toBeUndefined();
  });

  it('constructs the Resend client with the configured API key', async () => {
    await sendEmail(EMAIL);

    expect(resendCtorMock).toHaveBeenCalledWith(RESEND_API_KEY);
  });

  it('reuses a single Resend client across calls', async () => {
    await sendEmail(EMAIL);
    await sendEmail({ ...EMAIL, to: 'second@example.com' });

    expect(resendCtorMock).toHaveBeenCalledTimes(1);
  });

  it('forwards a given replyTo address to the Resend client', async () => {
    const replyTo = 'editor@example.com';

    await sendEmail({ ...EMAIL, replyTo });

    expect(sendMock).toHaveBeenCalledWith({ ...EMAIL, replyTo });
  });

  it('sends no replyTo when none is supplied', async () => {
    await sendEmail(EMAIL);

    expect(sentEmail()?.replyTo).toBeUndefined();
  });

  it('rejects a malformed replyTo address before calling the Resend client', async () => {
    await expect(
      sendEmail({ ...EMAIL, replyTo: 'not-an-email' }),
    ).rejects.toThrow('sendEmail received a malformed replyTo address');
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('strips a newline from the subject so it cannot inject a header', async () => {
    await sendEmail({
      ...EMAIL,
      subject: 'Confirm subscription\r\nBcc: attacker@evil.example',
    });

    expect(sentEmail()?.subject).toBe(
      'Confirm subscription Bcc: attacker@evil.example',
    );
  });

  it('strips a bare carriage return or line feed from the subject', async () => {
    await sendEmail({ ...EMAIL, subject: 'Line one\nLine two\rLine three' });

    expect(sentEmail()?.subject).toBe('Line one Line two Line three');
  });

  it('throws a clear error when Resend reports a send failure', async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'Invalid `to` field' },
    });

    await expect(sendEmail(EMAIL)).rejects.toThrow(
      'Failed to send email via Resend: Invalid `to` field',
    );
  });
});
