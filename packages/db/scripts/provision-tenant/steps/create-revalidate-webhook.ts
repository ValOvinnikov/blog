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

// Decides from the project's live hooks, never from `webhookCreatedAt`: a
// hook at an old `WEB_APP_URL`, or one deleted in Sanity, must be replaced.
export async function createTenantRevalidateWebhook(
  tenant: TTenant,
  env: TProvisionEnv,
): Promise<void> {
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

  const hasTargetWebhook = existingWebhooks.some(
    (webhook) => webhook.url === targetUrl,
  );

  if (!hasTargetWebhook) {
    await createSanityWebhook({
      token: env.sanityManagementToken,
      projectId: tenant.sanityProjectId,
      dataset: tenant.sanityDataset,
      name: WEBHOOK_NAME,
      url: targetUrl,
      secret: env.revalidateSecret,
    });
  }

  if (!hasTargetWebhook || !tenant.webhookCreatedAt) {
    await setTenantWebhookCreatedAt(tenant.id, new Date());
  }
}
