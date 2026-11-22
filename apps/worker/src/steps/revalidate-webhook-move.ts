import { updateSanityWebhookUrl } from '@shinefold/db/utils/sanity-management-client/sanity-webhooks';
import {
  listSanityWebhooks,
  type TListedSanityWebhook,
} from '@shinefold/db/utils/sanity-management-client/sanity-webhooks-list';
import { hasLength } from '@shinefold/utils/primitives';
import { REVALIDATE_WEBHOOK_NAME } from '@worker/constants/revalidate-webhook';
import type { TTenantWebhookTarget } from '@worker/steps/revalidate-webhook-secret';

export function targetingUrl(
  webhooks: TListedSanityWebhook[],
  url: string,
): TListedSanityWebhook[] {
  return webhooks.filter((webhook) => webhook.url === url);
}

// Sanity refuses a second hook under the same name, so one at an old URL is moved, never duplicated.
async function moveProvisionedWebhook(
  target: TTenantWebhookTarget,
  webhooks: TListedSanityWebhook[],
): Promise<TListedSanityWebhook[]> {
  const { token, projectId, url } = target;
  const provisioned = webhooks.find(
    ({ name }) => name === REVALIDATE_WEBHOOK_NAME,
  );
  if (!provisioned) return [];

  await updateSanityWebhookUrl({
    token,
    projectId,
    webhookId: provisioned.id,
    url,
  });
  return [{ ...provisioned, url }];
}

export async function webhooksAtUrl(
  target: TTenantWebhookTarget,
): Promise<{ webhooks: TListedSanityWebhook[]; isMoved: boolean }> {
  const { token, projectId, url } = target;
  const listed = await listSanityWebhooks({ token, projectId });
  const atUrl = targetingUrl(listed, url);
  if (hasLength(atUrl)) return { webhooks: atUrl, isMoved: false };

  const moved = await moveProvisionedWebhook(target, listed);
  return { webhooks: moved, isMoved: hasLength(moved) };
}
