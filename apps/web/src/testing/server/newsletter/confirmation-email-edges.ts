import { KEY_ENCODING } from '@blog/utils/encryption';

export const confirmationEmailEnv = {
  NEWSLETTER_FROM_ADDRESS: undefined,
  NEWSLETTER_UNSUBSCRIBE_KEY: Buffer.alloc(32, 1).toString(KEY_ENCODING),
};

export const confirmationEmailEdges = {
  claimConfirmationSend: vi.fn(),
  commitConfirmationToken: vi.fn(),
  releaseConfirmationSend: vi.fn(),
  getEmailConfig: vi.fn(),
  getEmailTemplate: vi.fn(),
  sendEmail: vi.fn(),
  resolveTenantEmailIdentity: vi.fn(),
};

export const confirmationEmailQueries = (
  subscribers: Record<string, unknown> = {},
) => ({
  subscribers: {
    claimConfirmationSend: confirmationEmailEdges.claimConfirmationSend,
    commitConfirmationToken: confirmationEmailEdges.commitConfirmationToken,
    releaseConfirmationSend: confirmationEmailEdges.releaseConfirmationSend,
    ...subscribers,
  },
  emailConfig: { getEmailConfig: confirmationEmailEdges.getEmailConfig },
  emailTemplates: { getEmailTemplate: confirmationEmailEdges.getEmailTemplate },
});
