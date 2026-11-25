import { setTimeout as sleep } from 'node:timers/promises';

import { getTenantSanityCredentials } from '@shinefold/db/queries/tenants';
import {
  createSanityRobotToken,
  deleteSanityRobotToken,
} from '@shinefold/db/utils/sanity-management-client/sanity-robot-tokens';
import { listSanityWebhooks } from '@shinefold/db/utils/sanity-management-client/sanity-webhooks-list';
import type { TTemporaryWriteTokenDeps } from '@worker/utils/temporary-write-token/temporary-write-token';
import { createTenantSanityClient } from '@worker/utils/tenant-sanity-client/tenant-sanity-client';
import { listVercelProjectDomains } from '@worker/utils/vercel-client/vercel-client';

type TStepSanityDeps = {
  createClient: typeof createTenantSanityClient;
  sleep: (ms: number) => Promise<void>;
};

export type TSeedContentDeps = TTemporaryWriteTokenDeps & TStepSanityDeps;

export type TVerifyTenantSeededContentDeps = TStepSanityDeps & {
  getCredentials: typeof getTenantSanityCredentials;
  listWebhooks: typeof listSanityWebhooks;
  listDomains: typeof listVercelProjectDomains;
};

export const seedContentDeps: TSeedContentDeps = {
  createClient: createTenantSanityClient,
  mintWriteToken: createSanityRobotToken,
  revokeWriteToken: deleteSanityRobotToken,
  sleep,
};

export const verifyContentDeps: TVerifyTenantSeededContentDeps = {
  createClient: createTenantSanityClient,
  getCredentials: getTenantSanityCredentials,
  listWebhooks: listSanityWebhooks,
  listDomains: listVercelProjectDomains,
  sleep,
};
