/**
 * Document-validation sweep entrypoint — runs `sanity documents validate`
 * against every in-scope tenant's own Sanity project/dataset (its existing
 * read token, env-overridden per invocation — see
 * `lib/run-sanity-documents-validate.ts`), persisting drift as `findings`
 * rows via `db.queries.findings` and emailing SUPERADMIN operators the first
 * time a tenant newly transitions into a failing state.
 *
 * Invoked only by `.github/workflows/validate-tenant-documents.yml` — the
 * weekly scheduled sweep (every in-scope tenant), a `workflow_dispatch`
 * (optionally scoped to one tenant via `--tenant-id=<uuid>`), or the
 * post-provisioning check `provision-tenant.yml` calls into for its own
 * freshly provisioned tenant — never run by hand against a shared/production
 * tenant registry outside that workflow.
 *
 * `--conditions=react-server` makes `getDb()`'s `import 'server-only'`
 * resolve to a no-op outside Next.js's own build, same trick
 * `provision-tenant/run.ts` relies on.
 */
import { pathToFileURL } from 'node:url';

import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
  type TFindingSeverity,
} from '@blog/config/constants';
import { TENANT_STATUS } from '@blog/db/constants';
import {
  listFindingsForTenant,
  openFinding,
  resolveFinding,
} from '@blog/db/queries/findings';
import {
  getTenantById,
  getTenantSanityCredentials,
  listTenantsForDocumentValidation,
} from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { sanitizeLogMessage } from '@blog/insight';

import { loadValidateEnv, type TValidateEnv } from './lib/env';
import { notifyOperatorsOfDocumentValidationFailure } from './lib/notify-operators';
import {
  validateTenantDocuments,
  type TSanityValidationResult,
} from './lib/run-sanity-documents-validate';

const TENANT_ID_FLAG = '--tenant-id=';

// Stable across tenants — `tenantId` + `source` + `kind` already scope the
// dedupe key to one tenant's document-validation state, so this only needs
// to be a constant, not per-document.
const DOCUMENT_VALIDATION_IDENTIFIER = 'documents';

function parseTenantId(argv: string[]): string | undefined {
  const flag = argv.find((arg) => arg.startsWith(TENANT_ID_FLAG));
  return (
    flag?.slice(TENANT_ID_FLAG.length) || process.env['TENANT_ID'] || undefined
  );
}

export type TValidateSummary = {
  checked: number;
  clean: number;
  warning: number;
  critical: number;
  skipped: number;
  errors: number;
};

function emptySummary(): TValidateSummary {
  return {
    checked: 0,
    clean: 0,
    warning: 0,
    critical: 0,
    skipped: 0,
    errors: 0,
  };
}

async function resolveOpenFindingIfAny(tenant: TTenant): Promise<void> {
  const openFindings = await listFindingsForTenant(
    tenant.id,
    FINDING_STATUS.OPEN,
  );
  const finding = openFindings.find(
    (item) =>
      item.source === FINDING_SOURCE.DOCUMENT_VALIDATION &&
      item.kind === FINDING_KIND.SCHEMA_VALIDATION_ERROR,
  );
  if (!finding) return;

  const result = await resolveFinding(finding.id);
  if (!result.ok) {
    console.error(
      `validate-tenant-documents: resolveFinding failed for tenant "${tenant.id}" (slug "${tenant.slug}"): ${result.error}`,
    );
  }
}

async function validateOne(
  tenant: TTenant,
  env: TValidateEnv,
  summary: TValidateSummary,
): Promise<void> {
  const credentials = await getTenantSanityCredentials(tenant.id);
  if (!credentials) {
    summary.skipped += 1;
    return;
  }

  if (
    credentials.status !== TENANT_STATUS.ACTIVE ||
    credentials.deprovisionedAt
  ) {
    summary.skipped += 1;
    console.log(
      `validate-tenant-documents: skipping tenant "${tenant.id}" (slug "${tenant.slug}") — status="${credentials.status}" deprovisionedAt=${credentials.deprovisionedAt ? credentials.deprovisionedAt.toISOString() : 'null'}`,
    );
    return;
  }

  let results: TSanityValidationResult[];
  try {
    results = validateTenantDocuments({
      projectId: credentials.projectId,
      dataset: credentials.dataset,
      token: credentials.token,
    });
  } catch (error) {
    summary.errors += 1;
    console.error(
      `validate-tenant-documents: sanity documents validate failed for tenant "${tenant.id}" (slug "${tenant.slug}"): ${sanitizeLogMessage(error)}`,
    );
    return;
  }

  if (results.length === 0) {
    summary.clean += 1;
    await resolveOpenFindingIfAny(tenant);
    return;
  }

  const severity: TFindingSeverity = results.some(
    (result) => result.level === 'error',
  )
    ? FINDING_SEVERITY.CRITICAL
    : FINDING_SEVERITY.WARNING;

  if (severity === FINDING_SEVERITY.CRITICAL) {
    summary.critical += 1;
  } else {
    summary.warning += 1;
  }

  const openResult = await openFinding({
    tenantId: tenant.id,
    source: FINDING_SOURCE.DOCUMENT_VALIDATION,
    kind: FINDING_KIND.SCHEMA_VALIDATION_ERROR,
    severity,
    identifier: DOCUMENT_VALIDATION_IDENTIFIER,
    details: { invalidDocumentCount: results.length, documents: results },
  });

  if (!openResult.ok) {
    summary.errors += 1;
    console.error(
      `validate-tenant-documents: openFinding failed for tenant "${tenant.id}" (slug "${tenant.slug}"): ${openResult.error}`,
    );
    return;
  }

  if (openResult.data.isNewlyOpened) {
    await notifyOperatorsOfDocumentValidationFailure({
      tenant,
      invalidDocumentCount: results.length,
      severity,
      resendApiKey: env.resendApiKey,
    });
  }
}

async function validateCandidates(
  candidates: TTenant[],
  env: TValidateEnv,
): Promise<TValidateSummary> {
  const summary = emptySummary();
  summary.checked = candidates.length;

  for (const tenant of candidates) {
    // Each tenant is independent — one tenant's CLI/network failure must
    // never abort the sweep for the rest.
    await validateOne(tenant, env, summary);
  }

  console.log(
    `validate-tenant-documents: checked ${summary.checked} tenant(s) — ` +
      `clean=${summary.clean} warning=${summary.warning} critical=${summary.critical} ` +
      `skipped=${summary.skipped} errors=${summary.errors}`,
  );

  return summary;
}

// Exported for direct testing of the sweep logic without also exercising env
// loading or tenant enumeration.
export async function runValidation(
  env: TValidateEnv,
): Promise<TValidateSummary> {
  const candidates = await listTenantsForDocumentValidation();
  return validateCandidates(candidates, env);
}

// Exported for direct testing of the single-tenant path — used by an
// operator's scoped `workflow_dispatch` and by the post-provisioning check.
export async function runValidationForTenant(
  tenantId: string,
  env: TValidateEnv,
): Promise<TValidateSummary> {
  const tenant = await getTenantById(tenantId);
  return validateCandidates(tenant ? [tenant] : [], env);
}

// Exported for direct testing of the exit-code decision without also
// exercising env loading or the sweep itself. `errors` means the sweep
// itself failed to determine a tenant's validity (a CLI/network failure, or
// a findings-store write failure) — the expected WARNING/CRITICAL outcomes
// are reportable results, not failures, and never count here.
export function hasSystemicFailures(summary: TValidateSummary): boolean {
  return summary.errors > 0;
}

async function main(): Promise<void> {
  const tenantId = parseTenantId(process.argv.slice(2));
  const env = loadValidateEnv();

  const summary = tenantId
    ? await runValidationForTenant(tenantId, env)
    : await runValidation(env);

  if (tenantId && summary.checked === 0) {
    console.error(
      `validate-tenant-documents: tenant "${tenantId}" not found (or deprovisioned) — nothing to validate.`,
    );
    process.exitCode = 1;
    return;
  }

  if (hasSystemicFailures(summary)) {
    process.exitCode = 1;
  }
}

// Only auto-run when this file is the CLI entrypoint (`tsx run.ts`) — guards
// against `main()` firing as an import side effect when a test imports
// `runValidation` from this same module.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error: unknown) => {
    console.error('validate-tenant-documents: unexpected failure:', error);
    process.exitCode = 1;
  });
}
