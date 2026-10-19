import { setTenantWebhookCreatedAt } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  createSanityWebhook,
  listSanityWebhooks,
} from '@blog/db/utils/sanity-management-client/sanity-webhooks';

import type { TProvisionEnv } from '../lib/env';

const WEBHOOK_NAME = 'web-revalidate (provisioned)';

export function revalidateWebhookUrl(webAppBaseUrl: string): string {
  return `${webAppBaseUrl}/api/revalidate`;
}

async function hasWebhookTargeting(
  token: string,
  projectId: string,
  targetUrl: string,
): Promise<boolean> {
  const webhooks = await listSanityWebhooks({ token, projectId });
  return webhooks.some((webhook) => webhook.url === targetUrl);
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

  const { sanityProjectId: projectId } = tenant;
  const { sanityManagementToken: token } = env;
  const targetUrl = revalidateWebhookUrl(env.webAppBaseUrl);

  const existedBefore = await hasWebhookTargeting(token, projectId, targetUrl);

  if (!existedBefore) {
    await createSanityWebhook({
      token,
      projectId,
      dataset: tenant.sanityDataset,
      name: WEBHOOK_NAME,
      url: targetUrl,
      secret: env.revalidateSecret,
    });

    if (!(await hasWebhookTargeting(token, projectId, targetUrl))) {
      throw new Error(
        `createTenantRevalidateWebhook: Sanity accepted the webhook for project "${projectId}", but no webhook targeting ${targetUrl} is listed afterwards.`,
      );
    }
  }

  if (!existedBefore || !tenant.webhookCreatedAt) {
    await setTenantWebhookCreatedAt(tenant.id, new Date());
  }
}
