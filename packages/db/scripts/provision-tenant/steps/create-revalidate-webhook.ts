import { setTenantWebhookCreatedAt } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';
import {
  createSanityWebhook,
  listSanityWebhooks,
} from '../lib/sanity-management-client';

const WEBHOOK_NAME = 'web-revalidate (provisioned)';

export function revalidateWebhookUrl(webAppBaseUrl: string): string {
  return `${webAppBaseUrl}/api/revalidate`;
}

/**
 * Step 6 — creates a Sanity webhook on the tenant's project pointing at the
 * shared `apps/web` revalidation endpoint. One URL and secret work for every
 * tenant: that route reads Sanity's own `sanity-project-id` header to
 * tenant-scope its cache tags, so nothing here needs to be tenant-specific
 * beyond which project the webhook is registered on.
 *
 * Idempotent: skips entirely once `tenants.webhookCreatedAt` is set. Also
 * skips creation (without duplicating it) when a webhook already targets
 * this exact URL — covers a run that crashed after creating the webhook but
 * before persisting that marker.
 */
export async function createTenantRevalidateWebhook(
  tenant: TTenant,
  env: TProvisionEnv,
): Promise<void> {
  if (tenant.webhookCreatedAt) return;

  if (!tenant.sanityProjectId || !tenant.sanityDataset) {
    throw new Error(
      `createTenantRevalidateWebhook: tenant "${tenant.id}" has no Sanity project yet — run the "Create Sanity project" step first.`,
    );
  }

  const targetUrl = revalidateWebhookUrl(env.webAppBaseUrl);

  const existingWebhooks = await listSanityWebhooks({
    token: env.sanityManagementToken,
    projectId: tenant.sanityProjectId,
  });

  if (!existingWebhooks.some((webhook) => webhook.url === targetUrl)) {
    await createSanityWebhook({
      token: env.sanityManagementToken,
      projectId: tenant.sanityProjectId,
      dataset: tenant.sanityDataset,
      name: WEBHOOK_NAME,
      url: targetUrl,
      secret: env.revalidateSecret,
    });
  }

  await setTenantWebhookCreatedAt(tenant.id, new Date());
}
