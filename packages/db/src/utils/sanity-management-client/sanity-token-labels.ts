import { PRODUCT_NAME } from '@blog/config';
import type { TSanityRobotTokenSummary } from '@blog/db/utils/sanity-management-client/sanity-robot-tokens';

// Sanity shows this label as the sender of the owner's project invite.
export const SANITY_MANAGEMENT_TOKEN_LABEL = PRODUCT_NAME;
export const SANITY_READ_TOKEN_LABEL = `${PRODUCT_NAME} web-read`;
export const SANITY_WRITE_TOKEN_LABEL = `${PRODUCT_NAME} web-write`;

export const LEGACY_SANITY_MANAGEMENT_TOKEN_LABEL = 'management (provisioned)';
export const LEGACY_SANITY_READ_TOKEN_LABEL = 'web-read (provisioned)';
export const LEGACY_SANITY_WRITE_TOKEN_LABEL = 'web-write (provisioned)';

const MANAGEMENT_TOKEN_LABELS: ReadonlySet<string> = new Set([
  SANITY_MANAGEMENT_TOKEN_LABEL,
  LEGACY_SANITY_MANAGEMENT_TOKEN_LABEL,
]);

const PROVISIONED_TOKEN_LABELS: ReadonlySet<string> = new Set([
  ...MANAGEMENT_TOKEN_LABELS,
  SANITY_READ_TOKEN_LABEL,
  SANITY_WRITE_TOKEN_LABEL,
  LEGACY_SANITY_READ_TOKEN_LABEL,
  LEGACY_SANITY_WRITE_TOKEN_LABEL,
]);

function isProvisionedRobotToken({ label }: TSanityRobotTokenSummary): boolean {
  return label !== undefined && PROVISIONED_TOKEN_LABELS.has(label);
}

function isManagementRobotToken({ label }: TSanityRobotTokenSummary): boolean {
  return label !== undefined && MANAGEMENT_TOKEN_LABELS.has(label);
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
