import { loadValidateEnv } from './env';

const originalResendApiKey = process.env['RESEND_API_KEY'];

afterEach(() => {
  if (originalResendApiKey === undefined) {
    delete process.env['RESEND_API_KEY'];
  } else {
    process.env['RESEND_API_KEY'] = originalResendApiKey;
  }
});

describe(loadValidateEnv, () => {
  it('leaves resendApiKey undefined when unset', () => {
    delete process.env['RESEND_API_KEY'];

    expect(loadValidateEnv()).toEqual({ resendApiKey: undefined });
  });

  it('resolves resendApiKey when RESEND_API_KEY is set', () => {
    process.env['RESEND_API_KEY'] = 'resend-key';

    expect(loadValidateEnv()).toEqual({ resendApiKey: 'resend-key' });
  });
});
