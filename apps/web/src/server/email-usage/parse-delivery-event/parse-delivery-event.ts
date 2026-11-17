import type { TMaybeUndefined } from '@shinefold/config';
import {
  EMAIL_DELIVERY_OUTCOME,
  type TEmailDeliveryOutcome,
} from '@shinefold/db/constants';
import {
  OWNER_NOTICE_EMAIL_TAG_NAME,
  PLATFORM_EMAIL_TAG_NAME,
  SITE_EMAIL_TAG_NAME,
} from '@shinefold/email';
import { isUndefined } from '@shinefold/utils/primitives';
import { RESEND_DELIVERY_EVENT_TYPE } from '@web/constants/email-usage';
import { z } from 'zod';

const OUTCOME_BY_EVENT_TYPE = {
  [RESEND_DELIVERY_EVENT_TYPE.DELIVERED]: EMAIL_DELIVERY_OUTCOME.DELIVERED,
  [RESEND_DELIVERY_EVENT_TYPE.BOUNCED]: EMAIL_DELIVERY_OUTCOME.BOUNCED,
  [RESEND_DELIVERY_EVENT_TYPE.COMPLAINED]: EMAIL_DELIVERY_OUTCOME.COMPLAINED,
} as const;

const deliveryEventTypeSchema = z.object({
  type: z.enum(RESEND_DELIVERY_EVENT_TYPE),
});

const deliveryEventSchema = deliveryEventTypeSchema.extend({
  data: z.object({
    tags: z.record(z.string(), z.string()).optional(),
  }),
});

const UNCOUNTED_EMAIL_TAG_NAMES = [
  PLATFORM_EMAIL_TAG_NAME,
  OWNER_NOTICE_EMAIL_TAG_NAME,
];

export interface IDeliveryEvent {
  outcome: TEmailDeliveryOutcome;
  siteTag: TMaybeUndefined<string>;
  isUncountedMail: boolean;
}

export const isDeliveryOutcomeEvent = (payload: unknown): boolean =>
  deliveryEventTypeSchema.safeParse(payload).success;

export const parseDeliveryEvent = (
  payload: unknown,
): TMaybeUndefined<IDeliveryEvent> => {
  const parsed = deliveryEventSchema.safeParse(payload);
  if (!parsed.success) return undefined;

  const { type, data } = parsed.data;

  return {
    outcome: OUTCOME_BY_EVENT_TYPE[type],
    siteTag: data.tags?.[SITE_EMAIL_TAG_NAME],
    isUncountedMail: UNCOUNTED_EMAIL_TAG_NAMES.some(
      (name) => !isUndefined(data.tags?.[name]),
    ),
  };
};

export const toSiteId = (siteTag: string): TMaybeUndefined<string> =>
  z.uuid().safeParse(siteTag).data;
