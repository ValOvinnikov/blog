import type { TValueOf } from '@blog/config/utils';

export const SANITY_WEBHOOK_OPERATION = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

export type TSanityWebhookOperation = TValueOf<typeof SANITY_WEBHOOK_OPERATION>;
