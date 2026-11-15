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
  REVALIDATE_WEBHOOK_PROJECTION,
  type TListedSanityWebhook,
  updateSanityWebhookProjection,
  updateSanityWebhookSecret,
} from '@blog/db/utils/sanity-management-client/sanity-webhooks';
import { HEX_ENCODING } from '@blog/utils/hash';
import { hasLength } from '@blog/utils/primitives';
import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';
import { requireTenantManagementToken } from '@worker/utils/tenant-management-token/tenant-management-token';

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
): Promise<TListedSanityWebhook[]> {
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
  await createSanityWebhook({
    token,
    projectId,
    dataset,
    name: WEBHOOK_NAME,
    url,
    secret: await storedOrNewSecret(target),
  });

  if (!hasLength(await webhooksTargeting(target))) {
    throw new Error(
      `createTenantRevalidateWebhook: Sanity accepted the webhook for project "${projectId}", but no webhook targeting ${url} is listed afterwards.`,
    );
  }
}

// Stored only after every hook carries it: a failed update leaves the tenant due for another rotation.
async function rotateWebhookSecret(
  target: TTenantWebhookTarget,
  webhooks: TListedSanityWebhook[],
): Promise<void> {
  const { tenantId, token, projectId } = target;
  const secret = generateWebhookSecret();
  for (const { id: webhookId } of webhooks) {
    await updateSanityWebhookSecret({ token, projectId, webhookId, secret });
  }
  await setTenantRevalidateWebhookSecret(tenantId, secret);
}

async function updateStaleProjections(
  target: TTenantWebhookTarget,
  webhooks: TListedSanityWebhook[],
): Promise<void> {
  const { token, projectId } = target;
  for (const { id: webhookId, projection } of webhooks) {
    if (projection === REVALIDATE_WEBHOOK_PROJECTION) continue;
    await updateSanityWebhookProjection({ token, projectId, webhookId });
  }
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
    token: await requireTenantManagementToken(tenantId),
    projectId: sanityProjectId,
    dataset: sanityDataset,
    url: revalidateWebhookUrl(env.webAppBaseUrl),
  };

  const existing = await webhooksTargeting(target);

  if (!hasLength(existing)) {
    await createWebhook(target);
  } else if (!tenant.revalidateWebhookSecretEncrypted) {
    await rotateWebhookSecret(target, existing);
  }

  await updateStaleProjections(target, existing);

  if (!hasLength(existing) || !tenant.webhookCreatedAt) {
    await setTenantWebhookCreatedAt(tenantId, new Date());
  }
}
