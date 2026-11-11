import type { TMaybeUndefined } from '@blog/config';
import { RESEND_WEBHOOK_HEADER } from '@web/constants/email-usage';
import { Webhook } from 'standardwebhooks';

export interface IVerifiedResendWebhook {
  eventId: string;
  payload: unknown;
}

export const verifyResendWebhook = (
  rawBody: string,
  headers: Headers,
  secret: string,
): TMaybeUndefined<IVerifiedResendWebhook> => {
  const eventId = headers.get(RESEND_WEBHOOK_HEADER.ID) ?? '';

  try {
    const payload = new Webhook(secret).verify(rawBody, {
      'webhook-id': eventId,
      'webhook-timestamp': headers.get(RESEND_WEBHOOK_HEADER.TIMESTAMP) ?? '',
      'webhook-signature': headers.get(RESEND_WEBHOOK_HEADER.SIGNATURE) ?? '',
    });
    return { eventId, payload };
  } catch {
    return undefined;
  }
};
