import {
  SANITY_API_SURFACE,
  HTTP_METHOD,
  HTTP_STATUS,
} from '@shinefold/config';
import { SANITY_API_PATH } from '@shinefold/db/utils/sanity-management-client/sanity-api-paths';
import {
  sanityApiError,
  sanityWebhooksResponse,
} from '@shinefold/db/utils/sanity-management-client/sanity-api-request';

function webhooksUnauthorizedHint(projectId: string): string {
  return `SANITY_MANAGEMENT_TOKEN is either invalid or not a member of project "${projectId}" — it is only an implicit administrator of projects it created itself. If this tenant points at a project created elsewhere (such as a shared dev project), add the token's robot to that project as administrator in Sanity Manage, or provision the tenant into its own project.`;
}

export async function sanityWebhooksRequest<T>(
  projectId: string,
  token: string,
  init: RequestInit = {},
  path: string = SANITY_API_PATH.projectWebhooks(projectId),
): Promise<T> {
  // A followed redirect replays a POST as a GET, whose 2xx list reads as success.
  const response = await sanityWebhooksResponse(
    path,
    token,
    { ...init, redirect: 'error' },
    [HTTP_STATUS.UNAUTHORIZED],
  );

  if (response.status === HTTP_STATUS.UNAUTHORIZED) {
    const body = await response.text().catch(() => '');
    throw sanityApiError(
      SANITY_API_SURFACE.WEBHOOKS,
      init.method ?? HTTP_METHOD.GET,
      path,
      response,
      `${body} ${webhooksUnauthorizedHint(projectId)}`,
    );
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
