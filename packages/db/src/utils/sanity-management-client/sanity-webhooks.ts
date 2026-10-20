import { SANITY_API_PATH } from '@blog/db/utils/sanity-management-client/sanity-api-paths';
import { SANITY_API_TIMEOUT_MS } from '@blog/db/utils/sanity-management-client/sanity-api-request';

// The global host, as `@sanity/cli` calls it; the project-scoped host answers a create with 2xx without creating a hook.
const SANITY_WEBHOOKS_API_BASE = 'https://api.sanity.io/v2025-08-04';

function webhooksUnauthorizedHint(projectId: string): string {
  return `SANITY_MANAGEMENT_TOKEN is either invalid or not a member of project "${projectId}" — it is only an implicit administrator of projects it created itself. If this tenant points at a project created elsewhere (such as a shared dev project), add the token's robot to that project as administrator in Sanity Manage, or provision the tenant into its own project.`;
}

async function sanityWebhooksRequest<T>(
  projectId: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const path = SANITY_API_PATH.projectWebhooks(projectId);
  // A followed redirect replays a POST as a GET, whose 2xx list reads as success.
  const response = await fetch(`${SANITY_WEBHOOKS_API_BASE}${path}`, {
    ...init,
    redirect: 'error',
    signal: AbortSignal.timeout(SANITY_API_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const hint =
      response.status === 401 ? ` ${webhooksUnauthorizedHint(projectId)}` : '';
    throw new Error(
      `Sanity Webhooks API ${init.method ?? 'GET'} ${path} failed: ${response.status} ${body}${hint}`,
    );
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export type TSanityWebhook = { id: string; url: string };

export async function listSanityWebhooks(input: {
  token: string;
  projectId: string;
}): Promise<TSanityWebhook[]> {
  return sanityWebhooksRequest<TSanityWebhook[]>(input.projectId, input.token);
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
      method: 'POST',
      body: JSON.stringify({
        type: 'document',
        name: input.name,
        dataset: input.dataset,
        url: input.url,
        apiVersion: 'v2021-06-07',
        httpMethod: 'POST',
        includeDrafts: false,
        rule: {
          on: ['create', 'update', 'delete'],
          projection: '{_type, _id, "slug": slug.current}',
        },
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
