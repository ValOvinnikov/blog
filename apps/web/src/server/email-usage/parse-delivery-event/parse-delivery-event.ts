import type { TMaybeUndefined } from '@blog/config';
import {
  EMAIL_DELIVERY_OUTCOME,
  type TEmailDeliveryOutcome,
} from '@blog/db/constants';
import { SITE_EMAIL_TAG_NAME } from '@blog/email';
import { RESEND_DELIVERY_EVENT_TYPE } from '@web/constants/email-usage';
import { z } from 'zod';

const OUTCOME_BY_EVENT_TYPE = {
  [RESEND_DELIVERY_EVENT_TYPE.DELIVERED]: EMAIL_DELIVERY_OUTCOME.DELIVERED,
  [RESEND_DELIVERY_EVENT_TYPE.BOUNCED]: EMAIL_DELIVERY_OUTCOME.BOUNCED,
  [RESEND_DELIVERY_EVENT_TYPE.COMPLAINED]: EMAIL_DELIVERY_OUTCOME.COMPLAINED,
} as const;

const deliveryEventSchema = z.object({
  type: z.enum(RESEND_DELIVERY_EVENT_TYPE),
  data: z.object({
    tags: z.record(z.string(), z.string()).optional(),
  }),
});

export interface IDeliveryEvent {
  outcome: TEmailDeliveryOutcome;
  siteTag: TMaybeUndefined<string>;
}

export const parseDeliveryEvent = (
  payload: unknown,
): TMaybeUndefined<IDeliveryEvent> => {
  const parsed = deliveryEventSchema.safeParse(payload);
  if (!parsed.success) return undefined;

  const { type, data } = parsed.data;

  return {
    outcome: OUTCOME_BY_EVENT_TYPE[type],
    siteTag: data.tags?.[SITE_EMAIL_TAG_NAME],
  };
};

export const toSiteId = (siteTag: string): TMaybeUndefined<string> =>
  z.uuid().safeParse(siteTag).data;
