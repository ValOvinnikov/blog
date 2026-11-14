import type { TMaybeUndefined } from '@blog/config/types';

const TENANT_ID_FLAG = '--tenant-id=';
const DRY_RUN_FLAG = '--dry-run=';

export function parseFlagValue(
  argv: string[],
  flag: string,
): TMaybeUndefined<string> {
  return argv.find((arg) => arg.startsWith(flag))?.slice(flag.length);
}

export function readOptionalTenantId(argv: string[]): TMaybeUndefined<string> {
  return (
    parseFlagValue(argv, TENANT_ID_FLAG) ||
    process.env['TENANT_ID'] ||
    undefined
  );
}

export function readRequiredTenantId(argv: string[], tool: string): string {
  const tenantId = readOptionalTenantId(argv);
  if (!tenantId) {
    throw new Error(
      `${tool}: missing required ${TENANT_ID_FLAG}<uuid> (or TENANT_ID env var).`,
    );
  }
  return tenantId;
}

// Dry run unless explicitly `false`, so a typo or a bare `--dry-run` never applies changes.
export function parseDryRun(argv: string[]): boolean {
  return (
    (parseFlagValue(argv, DRY_RUN_FLAG) ?? process.env['DRY_RUN']) !== 'false'
  );
}
