import { setTenantWebhookCreatedAt } from '@shinefold/db/queries/tenants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import {
  createSanityWebhook,
  listSanityWebhooks,
  REVALIDATE_WEBHOOK_PROJECTION,
  type TListedSanityWebhook,
  updateSanityWebhookProjection,
} from '@shinefold/db/utils/sanity-management-client/sanity-webhooks';
import { hasLength } from '@shinefold/utils/primitives';
import {
  REVALIDATE_WEBHOOK_CHANGE,
  type TRevalidateWebhookChange,
} from '@worker/constants/revalidate-webhook';
import {
  rotateWebhookSecret,
  storedOrNewSecret,
  type TTenantWebhookTarget,
} from '@worker/steps/revalidate-webhook-secret';
import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';
import { requireTenantManagementToken } from '@worker/utils/tenant-management-token/tenant-management-token';

const WEBHOOK_NAME = 'web-revalidate (provisioned)';

export function revalidateWebhookUrl(webAppBaseUrl: string): string {
  return new URL('/api/revalidate', webAppBaseUrl).href;
}

async function webhooksTargeting(
  target: TTenantWebhookTarget,
): Promise<TListedSanityWebhook[]> {
  const { token, projectId, url } = target;
  const webhooks = await listSanityWebhooks({ token, projectId });
  return webhooks.filter((webhook) => webhook.url === url);
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

async function updateStaleProjections(
  target: TTenantWebhookTarget,
  webhooks: TListedSanityWebhook[],
): Promise<boolean> {
  const { token, projectId } = target;
  const stale = webhooks.filter(
    ({ projection }) => projection !== REVALIDATE_WEBHOOK_PROJECTION,
  );
  for (const { id: webhookId } of stale) {
    await updateSanityWebhookProjection({ token, projectId, webhookId });
  }
  return hasLength(stale);
}

// Decides from the project's live hooks, never from `webhookCreatedAt`: a
// hook at an old `WEB_APP_URL`, or one deleted in Sanity, must be replaced.
export async function createTenantRevalidateWebhook(
  tenant: TTenant,
  { webAppBaseUrl }: Pick<TProvisionEnv, 'webAppBaseUrl'>,
): Promise<TRevalidateWebhookChange> {
  const {
    id: tenantId,
    sanityProjectId,
    sanityDataset,
    revalidateWebhookSecretEncrypted,
    webhookCreatedAt,
  } = tenant;
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
    url: revalidateWebhookUrl(webAppBaseUrl),
  };

  const existing = await webhooksTargeting(target);
  const isMissing = !hasLength(existing);
  const isUnrotated = !isMissing && !revalidateWebhookSecretEncrypted;

  if (isMissing) {
    await createWebhook(target);
  } else if (isUnrotated) {
    await rotateWebhookSecret(target, existing);
  }

  const hasUpdatedProjection = await updateStaleProjections(target, existing);

  if (isMissing || !webhookCreatedAt) {
    await setTenantWebhookCreatedAt(tenantId, new Date());
  }

  return isMissing || isUnrotated || hasUpdatedProjection
    ? REVALIDATE_WEBHOOK_CHANGE.UPDATED
    : REVALIDATE_WEBHOOK_CHANGE.UNCHANGED;
}
