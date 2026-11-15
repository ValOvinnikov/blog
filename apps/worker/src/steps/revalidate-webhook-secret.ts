import { randomBytes } from 'node:crypto';

import {
  getTenantRevalidateWebhookSecret,
  setTenantRevalidateWebhookSecret,
} from '@blog/db/queries/tenants';
import {
  type TListedSanityWebhook,
  updateSanityWebhookSecret,
} from '@blog/db/utils/sanity-management-client/sanity-webhooks';
import { HEX_ENCODING } from '@blog/utils/hash';

const WEBHOOK_SECRET_BYTES = 32;

export type TTenantWebhookTarget = {
  tenantId: string;
  token: string;
  projectId: string;
  dataset: string;
  url: string;
};

function generateWebhookSecret(): string {
  return randomBytes(WEBHOOK_SECRET_BYTES).toString(HEX_ENCODING);
}

// Stored before the hook exists, so a retry after a failed create signs with the same secret.
export async function storedOrNewSecret(
  target: TTenantWebhookTarget,
): Promise<string> {
  const { tenantId, projectId } = target;
  const stored = await getTenantRevalidateWebhookSecret(projectId);
  if (stored?.tenantId === tenantId && stored.secret) return stored.secret;

  const secret = generateWebhookSecret();
  await setTenantRevalidateWebhookSecret(tenantId, secret);
  return secret;
}

// Stored only after every hook carries it: a failed update leaves the tenant due for another rotation.
export async function rotateWebhookSecret(
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
