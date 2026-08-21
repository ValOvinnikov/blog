export type TTenantProvisioningRepo = {
  owner: string;
  repo: string;
};

/**
 * Splits `env.TENANT_PROVISIONING_GITHUB_REPO` (`owner/repo`) into its two
 * parts for building a GitHub API dispatch URL. Returns `undefined` for a
 * missing or malformed value so callers can treat it the same as a missing
 * token — skip the dispatch and log, never throw.
 */
export const parseTenantProvisioningRepo = (
  value: string | undefined,
): TTenantProvisioningRepo | undefined => {
  if (!value) return undefined;

  const [owner, repo] = value.split('/');
  return owner && repo ? { owner, repo } : undefined;
};
