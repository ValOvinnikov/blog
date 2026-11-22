import type { TMaybeNull } from '@shinefold/config/types';
import type { TSanityWebhook } from '@shinefold/db/utils/sanity-management-client/sanity-webhooks';
import { sanityWebhooksRequest } from '@shinefold/db/utils/sanity-management-client/sanity-webhooks-request';

export type TListedSanityWebhook = TSanityWebhook & {
  name: string;
  projection: TMaybeNull<string>;
};

type TSanityWebhookResponse = TSanityWebhook & {
  name: string;
  rule?: { projection?: TMaybeNull<string> };
};

export async function listSanityWebhooks(input: {
  token: string;
  projectId: string;
}): Promise<TListedSanityWebhook[]> {
  const webhooks = await sanityWebhooksRequest<TSanityWebhookResponse[]>(
    input.projectId,
    input.token,
  );
  return webhooks.map(({ id, name, url, rule }) => ({
    id,
    name,
    url,
    projection: rule?.projection ?? null,
  }));
}
