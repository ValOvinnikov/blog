import { MOCK_REVALIDATE_WEBHOOK_URL } from '@worker/testing/provision-env/fake-provision-env';

export const MOCK_WEBHOOK_ID = 'webhook-1';
const MOCK_OTHER_WEBHOOK_ID = 'webhook-0';
const MOCK_OTHER_WEBHOOK_URL = 'https://other.example.com/api/revalidate';
export const MOCK_CURRENT_WEBHOOK = {
  id: MOCK_WEBHOOK_ID,
  url: MOCK_REVALIDATE_WEBHOOK_URL,
};
export const MOCK_OTHER_WEBHOOK = {
  id: MOCK_OTHER_WEBHOOK_ID,
  url: MOCK_OTHER_WEBHOOK_URL,
};
