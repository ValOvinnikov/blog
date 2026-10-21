function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`recheck-tenant-owners: missing required env var ${name}.`);
  }
  return value;
}

export type TRecheckEnv = {
  sanityManagementToken: string;
};

export function loadRecheckEnv(): TRecheckEnv {
  return {
    sanityManagementToken: requireEnv('SANITY_MANAGEMENT_TOKEN'),
  };
}
