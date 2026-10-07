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

async function importSendEmail(): Promise<typeof import('./send-email')> {
  vi.resetModules();
  return import('./send-email');
}

describe('sendEmail', () => {
  let sendEmail: typeof import('./send-email').sendEmail;

  beforeEach(async () => {
    sendMock.mockReset();
    resendCtorMock.mockReset();
    process.env['RESEND_API_KEY'] = 'test-resend-key';
    sendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null });
    ({ sendEmail } = await importSendEmail());
  });

  it('sends the given email via the Resend client', async () => {
    await sendEmail({
      to: 'reader@example.com',
      from: 'Sign in <onboarding@resend.dev>',
      subject: 'Sign in to example.com',
      html: '<p>Click to sign in</p>',
    });

    expect(sendMock).toHaveBeenCalledWith({
      to: 'reader@example.com',
      from: 'Sign in <onboarding@resend.dev>',
      subject: 'Sign in to example.com',
      html: '<p>Click to sign in</p>',
    });
  });

  it('forwards custom headers to the Resend client when supplied', async () => {
    await sendEmail({
      to: 'reader@example.com',
      from: 'Newsletter <newsletter@resend.dev>',
      subject: 'Latest issue',
      html: '<p>Read the latest issue</p>',
      headers: {
        'List-Unsubscribe': '<https://example.com/unsubscribe>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    expect(sendMock).toHaveBeenCalledWith({
      to: 'reader@example.com',
      from: 'Newsletter <newsletter@resend.dev>',
      subject: 'Latest issue',
      html: '<p>Read the latest issue</p>',
      headers: {
        'List-Unsubscribe': '<https://example.com/unsubscribe>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
  });

  it('sends no headers when none are supplied', async () => {
    await sendEmail({
      to: 'reader@example.com',
      from: 'Sign in <onboarding@resend.dev>',
      subject: 'Sign in to example.com',
      html: '<p>Click to sign in</p>',
    });

    expect(sendMock.mock.calls[0]?.[0].headers).toBeUndefined();
  });

  it('constructs the Resend client with the configured API key', async () => {
    await sendEmail({
      to: 'a@example.com',
      from: 'from@example.com',
      subject: 'Subject',
      html: '<p>Body</p>',
    });

    expect(resendCtorMock).toHaveBeenCalledWith('test-resend-key');
  });

  it('reuses a single Resend client across calls', async () => {
    await sendEmail({
      to: 'a@example.com',
      from: 'from@example.com',
      subject: 'Subject',
      html: '<p>Body</p>',
    });
    await sendEmail({
      to: 'b@example.com',
      from: 'from@example.com',
      subject: 'Subject',
      html: '<p>Body</p>',
    });

    expect(resendCtorMock).toHaveBeenCalledTimes(1);
  });

  it('forwards a given replyTo address to the Resend client', async () => {
    await sendEmail({
      to: 'reader@example.com',
      from: 'Newsletter <newsletter@resend.dev>',
      subject: 'Latest issue',
      html: '<p>Read the latest issue</p>',
      replyTo: 'editor@example.com',
    });

    expect(sendMock).toHaveBeenCalledWith({
      to: 'reader@example.com',
      from: 'Newsletter <newsletter@resend.dev>',
      subject: 'Latest issue',
      html: '<p>Read the latest issue</p>',
      replyTo: 'editor@example.com',
    });
  });

  it('sends no replyTo when none is supplied', async () => {
    await sendEmail({
      to: 'reader@example.com',
      from: 'Sign in <onboarding@resend.dev>',
      subject: 'Sign in to example.com',
      html: '<p>Click to sign in</p>',
    });

    expect(sendMock.mock.calls[0]?.[0].replyTo).toBeUndefined();
  });

  it('rejects a malformed replyTo address before calling the Resend client', async () => {
    await expect(
      sendEmail({
        to: 'reader@example.com',
        from: 'from@example.com',
        subject: 'Subject',
        html: '<p>Body</p>',
        replyTo: 'not-an-email',
      }),
    ).rejects.toThrow('sendEmail received a malformed replyTo address');
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('strips a newline from the subject so it cannot inject a header', async () => {
    await sendEmail({
      to: 'reader@example.com',
      from: 'from@example.com',
      subject: 'Confirm subscription\r\nBcc: attacker@evil.example',
      html: '<p>Body</p>',
    });

    const sentSubject = sendMock.mock.calls[0]?.[0].subject as string;
    expect(sentSubject).not.toMatch(/[\r\n]/);
    expect(sentSubject).toBe('Confirm subscription Bcc: attacker@evil.example');
  });

  it('strips a bare carriage return or line feed from the subject', async () => {
    await sendEmail({
      to: 'reader@example.com',
      from: 'from@example.com',
      subject: 'Line one\nLine two\rLine three',
      html: '<p>Body</p>',
    });

    const sentSubject = sendMock.mock.calls[0]?.[0].subject as string;
    expect(sentSubject).not.toMatch(/[\r\n]/);
  });

  it('throws a clear error when Resend reports a send failure', async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'Invalid `to` field' },
    });

    await expect(
      sendEmail({
        to: 'not-an-email',
        from: 'from@example.com',
        subject: 'Subject',
        html: '<p>Body</p>',
      }),
    ).rejects.toThrow('Failed to send email via Resend: Invalid `to` field');
  });
});
