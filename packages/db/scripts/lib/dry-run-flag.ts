const DRY_RUN_FLAG = '--dry-run';

export function hasDryRunFlag(argv: string[]): boolean {
  return argv.includes(DRY_RUN_FLAG);
}
