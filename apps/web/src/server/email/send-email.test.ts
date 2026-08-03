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

// The real `@t3-oss/env-nextjs` module throws when a server var is read
// under jsdom (it treats `window` being defined as "client context") — mock
// it the same way `route.test.ts` files in this app already do.
vi.mock('@web/utils/env/env', () => ({
  env: { RESEND_API_KEY: 'test-resend-key' },
}));

describe('sendEmail', () => {
  beforeEach(() => {
    sendMock.mockReset();
    resendCtorMock.mockReset();
    vi.resetModules();
  });

  it('sends the given email via the Resend client', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null });

    const { sendEmail } = await import('./send-email');
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

  it('reuses a single Resend client across calls', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null });

    const { sendEmail } = await import('./send-email');
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

    const { sendEmail } = await import('./send-email');

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
