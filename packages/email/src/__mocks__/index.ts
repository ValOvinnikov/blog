import type { sendEmail as TSendEmail } from '@shinefold/email/transport/send-email';

export * from '@shinefold/email/index';

export const sendEmail = vi.fn<typeof TSendEmail>();
