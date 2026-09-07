/**
 * Seeds default email-template copy (see `seedEmailTemplateDefaults`) for
 * every active tenant that predates the email-templates feature and so
 * never went through the provisioning step that now does this. Idempotent —
 * `seedEmailTemplateDefaults` never overwrites a row that already exists,
 * so re-running finds nothing new to seed once every tenant has rows.
 *
 * MANUAL, HUMAN-RUN ONLY — never wired into CI or any deploy pipeline. Run
 * it by hand, once, against the target Neon branch:
 *
 *   set -a && source apps/web/.env.local && set +a
 *   pnpm --filter @blog/db db:backfill-email-template-defaults -- --dry-run
 *   pnpm --filter @blog/db db:backfill-email-template-defaults
 *
 * `--dry-run` lists the affected tenant ids without writing; omit it to
 * apply.
 */
import { pathToFileURL } from 'node:url';

import { seedEmailTemplateDefaults } from '@blog/db/queries/email-templates';
import { listActiveTenants } from '@blog/db/queries/tenants';

// Exported for direct testing of the backfill logic without also exercising
// argv parsing.
export async function backfillEmailTemplateDefaults(
  dryRun: boolean,
): Promise<number> {
  const tenants = await listActiveTenants();

  for (const tenant of tenants) {
    console.warn(
      `backfill-email-template-defaults: ${dryRun ? 'would seed' : 'seeding'} tenant "${tenant.id}" (${tenant.primaryDomain}).`,
    );

    if (!dryRun) {
      await seedEmailTemplateDefaults(tenant.id);
    }
  }

  return tenants.length;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const count = await backfillEmailTemplateDefaults(dryRun);

  console.warn(
    `backfill-email-template-defaults: ${count} tenant(s) ${dryRun ? 'found' : 'seeded'}.`,
  );
}

// Only auto-run when this file is the CLI entrypoint (`tsx
// backfill-email-template-defaults.ts`) — guards against `main()` firing as
// an import side effect when a test imports `backfillEmailTemplateDefaults`
// from this same module.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main()
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
