function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`recheck-tenant-owners: missing required env var ${name}.`);
  }
  return value;
}

// Deliberately narrower than `provision-tenant`'s `TProvisionEnv` — this
// sweep only ever calls `elevateTenantOwner`, which needs just the Sanity
// management token. Structurally compatible with `TProvisionEnv` (same
// field name and type), so it satisfies that function's parameter type
// without importing it.
export type TRecheckEnv = {
  sanityManagementToken: string;
  // Optional: unset means operator notification is skipped, not that the
  // sweep fails — see `notifyOperatorsOfOwnerElevationOutcome`.
  resendApiKey?: string;
};

export function loadRecheckEnv(): TRecheckEnv {
  return {
    sanityManagementToken: requireEnv('SANITY_MANAGEMENT_TOKEN'),
    resendApiKey: process.env['RESEND_API_KEY'] || undefined,
  };
}
