import type { sendEmail as TSendEmail } from '@blog/email/transport/send-email';

export * from '@blog/email/index';

export const sendEmail = vi.fn<typeof TSendEmail>();
