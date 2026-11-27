import {
  HTTP_METHOD,
  HTTP_STATUS,
  SANITY_API_SURFACE,
} from '@shinefold/config';
import { SANITY_API_PATH } from '@shinefold/db/utils/sanity-management-client/sanity-api-paths';
import {
  sanityAccessResponse,
  sanityApiError,
} from '@shinefold/db/utils/sanity-management-client/sanity-api-request';
import {
  deleteSanityRobotToken,
  type TSanityRobotTokenSummary,
} from '@shinefold/db/utils/sanity-management-client/sanity-robot-tokens';

export const SANITY_TOKEN_MANAGEMENT_SCOPE_MISMATCH =
  'token_management_scope_mismatch';

export function missingManagementRobotIdMessage(tenantId: string): string {
  return `Tenant "${tenantId}" has no stored Sanity management robot id (sanityManagementRobotId), so its robot tokens cannot be revoked with the management token last — none were revoked. Revoke them in Sanity Manage.`;
}

// The management token revokes itself, so it goes last; the organisation token's own robot is never revoked, or the platform loses the project.
export function robotsInRevocationOrder(
  robots: TSanityRobotTokenSummary[],
  robotIds: { managementRobotId: string; organizationRobotId: string },
): TSanityRobotTokenSummary[] {
  const { managementRobotId, organizationRobotId } = robotIds;
  const revocable = robots.filter(({ id }) => id !== organizationRobotId);
  return [
    ...revocable.filter(({ id }) => id !== managementRobotId),
    ...revocable.filter(({ id }) => id === managementRobotId),
  ];
}

// A robot managed by the organisation refuses the project's own management token, so it falls back to the organisation token.
export async function revokeSanityRobotToken(input: {
  token: string;
  organizationToken: string;
  projectId: string;
  robotId: string;
}): Promise<void> {
  const { token, organizationToken, projectId, robotId } = input;
  const path = SANITY_API_PATH.projectRobot(projectId, robotId);
  const response = await sanityAccessResponse(
    path,
    token,
    { method: HTTP_METHOD.DELETE },
    [HTTP_STATUS.FORBIDDEN],
  );
  if (response.status !== HTTP_STATUS.FORBIDDEN) return;

  const body = await response.text().catch(() => '');
  if (!body.includes(SANITY_TOKEN_MANAGEMENT_SCOPE_MISMATCH)) {
    throw sanityApiError(
      SANITY_API_SURFACE.ACCESS,
      HTTP_METHOD.DELETE,
      path,
      response,
      body,
    );
  }
  await deleteSanityRobotToken({
    token: organizationToken,
    projectId,
    robotId,
  });
}
