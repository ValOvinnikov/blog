import type { TSanityRobotTokenSummary } from '@blog/db/utils/sanity-management-client/sanity-robot-tokens';

export const SANITY_READ_TOKEN_LABEL = 'web-read (provisioned)';
export const SANITY_WRITE_TOKEN_LABEL = 'web-write (provisioned)';
export const SANITY_MANAGEMENT_TOKEN_LABEL = 'management (provisioned)';

const PROVISIONED_TOKEN_LABELS: ReadonlySet<string> = new Set([
  SANITY_READ_TOKEN_LABEL,
  SANITY_WRITE_TOKEN_LABEL,
  SANITY_MANAGEMENT_TOKEN_LABEL,
]);

function isProvisionedRobotToken({ label }: TSanityRobotTokenSummary): boolean {
  return label !== undefined && PROVISIONED_TOKEN_LABELS.has(label);
}

function isManagementRobotToken({ label }: TSanityRobotTokenSummary): boolean {
  return label === SANITY_MANAGEMENT_TOKEN_LABEL;
}

// The management token revokes itself, so it goes last.
export function provisionedTokensInRevocationOrder(
  robots: TSanityRobotTokenSummary[],
): TSanityRobotTokenSummary[] {
  const provisioned = robots.filter(isProvisionedRobotToken);
  return [
    ...provisioned.filter((robot) => !isManagementRobotToken(robot)),
    ...provisioned.filter(isManagementRobotToken),
  ];
}
