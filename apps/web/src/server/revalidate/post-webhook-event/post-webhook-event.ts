import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';

export type TPostWebhookEvent = {
  operation: TMaybeNull<string>;
  type: string;
  id: string;
  tenantId: TMaybeUndefined<string>;
};
