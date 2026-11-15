import type { TValueOf } from '@blog/config/utils';

export const REVALIDATE_WEBHOOK_LOG = {
  ROTATION_TENANT_FAILED: 'webhook_secret_rotation.tenant_failed',
  ROTATION_FINISHED: 'webhook_secret_rotation.finished',
  ROTATION_FAILED: 'webhook_secret_rotation.failed',
  SYNC_TENANT_FAILED: 'revalidate_webhook_sync.tenant_failed',
  SYNC_FINISHED: 'revalidate_webhook_sync.finished',
  SYNC_FAILED: 'revalidate_webhook_sync.failed',
} as const;

export const REVALIDATE_WEBHOOK_CHANGE = {
  UPDATED: 'UPDATED',
  UNCHANGED: 'UNCHANGED',
} as const;

export type TRevalidateWebhookChange = TValueOf<
  typeof REVALIDATE_WEBHOOK_CHANGE
>;
