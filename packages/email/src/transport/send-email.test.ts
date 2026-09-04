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
  beforeEach(() => {
    sendMock.mockReset();
    resendCtorMock.mockReset();
    process.env['RESEND_API_KEY'] = 'test-resend-key';
  });

  it('sends the given email via the Resend client', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null });

    const { sendEmail } = await importSendEmail();
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
    sendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null });

    const { sendEmail } = await importSendEmail();
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
    sendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null });

    const { sendEmail } = await importSendEmail();
    await sendEmail({
      to: 'reader@example.com',
      from: 'Sign in <onboarding@resend.dev>',
      subject: 'Sign in to example.com',
      html: '<p>Click to sign in</p>',
    });

    expect(sendMock.mock.calls[0]?.[0].headers).toBeUndefined();
  });

  it('constructs the Resend client with the configured API key', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null });

    const { sendEmail } = await importSendEmail();
    await sendEmail({
      to: 'a@example.com',
      from: 'from@example.com',
      subject: 'Subject',
      html: '<p>Body</p>',
    });

    expect(resendCtorMock).toHaveBeenCalledWith('test-resend-key');
  });

  it('reuses a single Resend client across calls', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null });

    const { sendEmail } = await importSendEmail();
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

  it('throws a clear error when Resend reports a send failure', async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'Invalid `to` field' },
    });

    const { sendEmail } = await importSendEmail();

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
