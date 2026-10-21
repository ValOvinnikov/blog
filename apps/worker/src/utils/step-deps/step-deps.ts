import { setTimeout as sleep } from 'node:timers/promises';

import { getTenantSanityCredentials } from '@blog/db/queries/tenants';
import { SANITY_API_TIMEOUT_MS } from '@blog/db/utils/sanity-management-client/sanity-api-request';
import {
  createSanityRobotToken,
  deleteSanityRobotToken,
} from '@blog/db/utils/sanity-management-client/sanity-robot-tokens';
import { listSanityWebhooks } from '@blog/db/utils/sanity-management-client/sanity-webhooks';
import { createClient } from '@sanity/client';
import { type TSeedContentDeps } from '@worker/steps/seed-content';
import { type TVerifyTenantSeededContentDeps } from '@worker/steps/verify-seeded-content';
import { listVercelProjectDomains } from '@worker/utils/vercel-client/vercel-client';

function createClientWithTimeout(
  config: Parameters<typeof createClient>[0],
): ReturnType<typeof createClient> {
  return createClient({ ...config, timeout: SANITY_API_TIMEOUT_MS });
}

export const seedContentDeps: TSeedContentDeps = {
  createClient: createClientWithTimeout,
  mintWriteToken: createSanityRobotToken,
  revokeWriteToken: deleteSanityRobotToken,
  sleep,
};

export const verifyContentDeps: TVerifyTenantSeededContentDeps = {
  createClient: createClientWithTimeout,
  getCredentials: getTenantSanityCredentials,
  listWebhooks: listSanityWebhooks,
  listDomains: listVercelProjectDomains,
  sleep,
};
