import 'server-only';

import { EMAIL_ACCOUNT, sendEmail, type TSendEmailInput } from '@blog/email';
import { resolveOperatorAlertFromAddress } from '@platform/server/email/resolve-operator-alert-from-address';

type TOperatorAlertEmail = Pick<TSendEmailInput, 'subject' | 'html'>;

export const sendOperatorAlertEmail = async (
  recipients: string[],
  { subject, html }: TOperatorAlertEmail,
): Promise<unknown[]> => {
  const from = resolveOperatorAlertFromAddress();
  const results = await Promise.allSettled(
    recipients.map((to) =>
      sendEmail({ account: EMAIL_ACCOUNT.PLATFORM, to, from, subject, html }),
    ),
  );

  return results
    .filter((result) => result.status === 'rejected')
    .map(({ reason }) => reason);
};
