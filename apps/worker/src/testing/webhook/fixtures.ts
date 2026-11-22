import { REVALIDATE_WEBHOOK_PROJECTION } from '@shinefold/db/utils/sanity-management-client/sanity-webhooks';
import type { TListedSanityWebhook } from '@shinefold/db/utils/sanity-management-client/sanity-webhooks-list';
import { MOCK_REVALIDATE_WEBHOOK_URL } from '@worker/testing/provision-env/fake-provision-env';

export const MOCK_WEBHOOK_ID = 'webhook-1';
const MOCK_WEBHOOK_NAME = 'revalidate-webhook';
const MOCK_OTHER_WEBHOOK_ID = 'webhook-0';
const MOCK_OTHER_WEBHOOK_NAME = 'other-webhook';
const MOCK_OTHER_WEBHOOK_URL = 'https://other.example.com/api/revalidate';
export const MOCK_CURRENT_WEBHOOK: TListedSanityWebhook = {
  id: MOCK_WEBHOOK_ID,
  name: MOCK_WEBHOOK_NAME,
  url: MOCK_REVALIDATE_WEBHOOK_URL,
  projection: REVALIDATE_WEBHOOK_PROJECTION,
};
export const MOCK_STALE_PROJECTION_WEBHOOK: TListedSanityWebhook = {
  ...MOCK_CURRENT_WEBHOOK,
  projection: '{_type, _id, "slug": slug.current}',
};
export const MOCK_OTHER_WEBHOOK: TListedSanityWebhook = {
  id: MOCK_OTHER_WEBHOOK_ID,
  name: MOCK_OTHER_WEBHOOK_NAME,
  url: MOCK_OTHER_WEBHOOK_URL,
  projection: null,
};
