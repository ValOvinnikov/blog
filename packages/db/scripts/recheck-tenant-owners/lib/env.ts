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
};

export function loadRecheckEnv(): TRecheckEnv {
  return {
    sanityManagementToken: requireEnv('SANITY_MANAGEMENT_TOKEN'),
  };
}
