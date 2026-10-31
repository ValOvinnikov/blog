import type { TSanityRobotTokenSummary } from '@blog/db/utils/sanity-management-client/sanity-robot-tokens';

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
