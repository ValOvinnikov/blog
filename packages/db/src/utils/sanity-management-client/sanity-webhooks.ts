import { HTTP_METHOD, SANITY_WEBHOOK_OPERATION } from '@blog/config';
import type { TMaybeNull } from '@blog/config/types';
import { SANITY_API_PATH } from '@blog/db/utils/sanity-management-client/sanity-api-paths';
import { sanityWebhooksRequest } from '@blog/db/utils/sanity-management-client/sanity-webhooks-request';

// `before()` is null on a create, so `previousSlug` is too.
const REVALIDATE_WEBHOOK_PROJECTION =
  '{_type, _id, "slug": slug.current, "previousSlug": before().slug.current}';

const REVALIDATE_WEBHOOK_RULE = {
  on: [
    SANITY_WEBHOOK_OPERATION.CREATE,
    SANITY_WEBHOOK_OPERATION.UPDATE,
    SANITY_WEBHOOK_OPERATION.DELETE,
  ],
  projection: REVALIDATE_WEBHOOK_PROJECTION,
};

export type TSanityWebhook = { id: string; url: string };

export type TListedSanityWebhook = TSanityWebhook & {
  projection: TMaybeNull<string>;
};

type TSanityWebhookResponse = TSanityWebhook & {
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
  return webhooks.map(({ id, url, rule }) => ({
    id,
    url,
    projection: rule?.projection ?? null,
  }));
}

export async function createSanityWebhook(input: {
  token: string;
  projectId: string;
  dataset: string;
  name: string;
  url: string;
  secret: string;
}): Promise<TSanityWebhook> {
  const created = await sanityWebhooksRequest<Partial<TSanityWebhook>>(
    input.projectId,
    input.token,
    {
      method: HTTP_METHOD.POST,
      body: JSON.stringify({
        type: 'document',
        name: input.name,
        dataset: input.dataset,
        url: input.url,
        apiVersion: 'v2021-06-07',
        httpMethod: HTTP_METHOD.POST,
        includeDrafts: false,
        rule: REVALIDATE_WEBHOOK_RULE,
        secret: input.secret,
      }),
    },
  );

  if (!created?.id || created.url !== input.url) {
    throw new Error(
      `Sanity Webhooks API: creating the webhook for project "${input.projectId}" returned no hook targeting ${input.url}.`,
    );
  }

  return { id: created.id, url: created.url };
}

async function patchSanityWebhook(
  input: { token: string; projectId: string; webhookId: string },
  patch: { secret: string } | { rule: typeof REVALIDATE_WEBHOOK_RULE },
): Promise<void> {
  const { token, projectId, webhookId } = input;
  const updated = await sanityWebhooksRequest<Partial<TSanityWebhook>>(
    projectId,
    token,
    { method: HTTP_METHOD.PATCH, body: JSON.stringify(patch) },
    SANITY_API_PATH.projectWebhook(projectId, webhookId),
  );

  if (updated?.id !== webhookId) {
    throw new Error(
      `Sanity Webhooks API: updating webhook "${webhookId}" of project "${projectId}" returned no matching hook.`,
    );
  }
}

export async function updateSanityWebhookSecret(input: {
  token: string;
  projectId: string;
  webhookId: string;
  secret: string;
}): Promise<void> {
  await patchSanityWebhook(input, { secret: input.secret });
}

export async function updateSanityWebhookProjection(input: {
  token: string;
  projectId: string;
  webhookId: string;
}): Promise<void> {
  await patchSanityWebhook(input, { rule: REVALIDATE_WEBHOOK_RULE });
}
