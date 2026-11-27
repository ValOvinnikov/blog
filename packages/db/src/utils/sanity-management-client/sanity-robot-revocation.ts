import {
  deleteSanityRobotToken,
  type TSanityRobotTokenSummary,
} from '@shinefold/db/utils/sanity-management-client/sanity-robot-tokens';

export const SANITY_TOKEN_MANAGEMENT_SCOPE_MISMATCH =
  'token_management_scope_mismatch';

export function missingManagementRobotIdMessage(tenantId: string): string {
  return `Tenant "${tenantId}" has no stored Sanity management robot id (sanityManagementRobotId), so its robot tokens cannot be revoked with the management token last — none were revoked. Revoke them in Sanity Manage.`;
}

// The management token revokes itself, so it goes last.
export function robotsInRevocationOrder(
  robots: TSanityRobotTokenSummary[],
  managementRobotId: string,
): TSanityRobotTokenSummary[] {
  return [
    ...robots.filter(({ id }) => id !== managementRobotId),
    ...robots.filter(({ id }) => id === managementRobotId),
  ];
}

function isTokenManagementScopeMismatch(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes(SANITY_TOKEN_MANAGEMENT_SCOPE_MISMATCH)
  );
}

// A robot managed by the organisation refuses the project's own management token, so it falls back to the organisation token.
export async function revokeSanityRobotToken(input: {
  token: string;
  organisationToken: string;
  projectId: string;
  robotId: string;
}): Promise<void> {
  const { token, organisationToken, projectId, robotId } = input;
  try {
    await deleteSanityRobotToken({ token, projectId, robotId });
  } catch (error) {
    if (!isTokenManagementScopeMismatch(error)) throw error;
    await deleteSanityRobotToken({
      token: organisationToken,
      projectId,
      robotId,
    });
  }
}
