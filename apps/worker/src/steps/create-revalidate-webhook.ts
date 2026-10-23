import { randomBytes } from 'node:crypto';

import {
  getTenantRevalidateWebhookSecret,
  setTenantRevalidateWebhookSecret,
  setTenantWebhookCreatedAt,
} from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  createSanityWebhook,
  listSanityWebhooks,
  type TSanityWebhook,
  updateSanityWebhookSecret,
} from '@blog/db/utils/sanity-management-client/sanity-webhooks';
import { HEX_ENCODING } from '@blog/utils/hash';
import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';

const WEBHOOK_NAME = 'web-revalidate (provisioned)';
const WEBHOOK_SECRET_BYTES = 32;

type TTenantWebhookTarget = {
  tenantId: string;
  token: string;
  projectId: string;
  dataset: string;
  url: string;
};

export function revalidateWebhookUrl(webAppBaseUrl: string): string {
  return `${webAppBaseUrl}/api/revalidate`;
}

function generateWebhookSecret(): string {
  return randomBytes(WEBHOOK_SECRET_BYTES).toString(HEX_ENCODING);
}

async function webhooksTargeting(
  target: TTenantWebhookTarget,
): Promise<TSanityWebhook[]> {
  const { token, projectId, url } = target;
  const webhooks = await listSanityWebhooks({ token, projectId });
  return webhooks.filter((webhook) => webhook.url === url);
}

// Stored before the hook exists, so a retry after a failed create signs with the same secret.
async function storedOrNewSecret(
  target: TTenantWebhookTarget,
): Promise<string> {
  const { tenantId, projectId } = target;
  const stored = await getTenantRevalidateWebhookSecret(projectId);
  if (stored?.tenantId === tenantId && stored.secret) return stored.secret;

  const secret = generateWebhookSecret();
  await setTenantRevalidateWebhookSecret(tenantId, secret);
  return secret;
}

async function createWebhook(target: TTenantWebhookTarget): Promise<void> {
  const { token, projectId, dataset, url } = target;
  const secret = await storedOrNewSecret(target);
  await createSanityWebhook({
    token,
    projectId,
    dataset,
    name: WEBHOOK_NAME,
    url,
    secret,
  });

  if ((await webhooksTargeting(target)).length === 0) {
    throw new Error(
      `createTenantRevalidateWebhook: Sanity accepted the webhook for project "${projectId}", but no webhook targeting ${url} is listed afterwards.`,
    );
  }
}

// Stored only after every hook carries it: a failed update leaves the tenant due for another rotation.
async function rotateWebhookSecret(
  target: TTenantWebhookTarget,
  webhooks: TSanityWebhook[],
): Promise<void> {
  const { tenantId, token, projectId } = target;
  const secret = generateWebhookSecret();
  for (const { id: webhookId } of webhooks) {
    await updateSanityWebhookSecret({ token, projectId, webhookId, secret });
  }
  await setTenantRevalidateWebhookSecret(tenantId, secret);
}

// Decides from the project's live hooks, never from `webhookCreatedAt`: a
// hook at an old `WEB_APP_URL`, or one deleted in Sanity, must be replaced.
export async function createTenantRevalidateWebhook(
  tenant: TTenant,
  env: TProvisionEnv,
): Promise<void> {
  const { id: tenantId, sanityProjectId, sanityDataset } = tenant;
  if (!sanityProjectId || !sanityDataset) {
    throw new Error(
      `createTenantRevalidateWebhook: tenant "${tenantId}" has no Sanity project yet — run the "Create Sanity project" step first.`,
    );
  }

  const target: TTenantWebhookTarget = {
    tenantId,
    token: env.sanityManagementToken,
    projectId: sanityProjectId,
    dataset: sanityDataset,
    url: revalidateWebhookUrl(env.webAppBaseUrl),
  };

  const existing = await webhooksTargeting(target);

  if (existing.length === 0) {
    await createWebhook(target);
  } else if (!tenant.revalidateWebhookSecretEncrypted) {
    await rotateWebhookSecret(target, existing);
  }

  if (existing.length === 0 || !tenant.webhookCreatedAt) {
    await setTenantWebhookCreatedAt(tenantId, new Date());
  }
}
