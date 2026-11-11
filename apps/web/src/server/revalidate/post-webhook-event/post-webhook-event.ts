import type { TMaybeNull, TMaybeUndefined } from '@blog/config';

export type TPostWebhookEvent = {
  operation: TMaybeNull<string>;
  type: string;
  id: string;
  tenantId: TMaybeUndefined<string>;
};
