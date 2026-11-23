import type { TSendEmailInput } from '@shinefold/email';
import type { Mock } from 'vitest';

export const sentEmailOf = (
  sendEmailMock: Mock<(input: TSendEmailInput) => Promise<void>>,
): TSendEmailInput => {
  const email = sendEmailMock.mock.calls[0]?.[0];
  if (!email) throw new Error('sendEmail was not called');

  return email;
};
