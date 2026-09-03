import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// This script lives outside `packages/studio`, unlike
// `refresh-dev-dataset.mjs` (which resolves its own directory as the
// studio root) — `sanity documents validate` must run with the Studio
// directory as its cwd, since `getProjectRoot()` requires one.
const studioDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../studio',
);

export type TSanityValidationMarkerLevel = 'error' | 'warning' | 'info';

export type TSanityValidationMarker = {
  level: TSanityValidationMarkerLevel;
  message: string;
  path?: unknown[];
};

export type TSanityValidationResult = {
  documentId: string;
  documentType: string;
  level: TSanityValidationMarkerLevel;
  markers: TSanityValidationMarker[];
  revision?: string;
};

export type TValidateTenantDocumentsParams = {
  projectId: string;
  dataset: string;
  token: string;
};

function isExecError(error: unknown): error is { stdout?: string } {
  return typeof error === 'object' && error !== null && 'stdout' in error;
}

/**
 * Runs `sanity documents validate` scoped to one tenant's project/dataset/
 * token via env overrides — `sanity.cli.ts` resolves
 * `SANITY_STUDIO_PROJECT_ID`/`SANITY_STUDIO_DATASET` at config-load time,
 * before any CLI flag is parsed, so an ambient value would silently target
 * the console reference project instead. Returns every document that
 * carries at least one warning- or error-level marker; the CLI itself
 * exits non-zero only when at least one marker is error-level, which is a
 * reachable, expected outcome here — not a script failure — so that exit
 * code is caught and its still-captured stdout parsed the same as a clean
 * exit.
 */
export function validateTenantDocuments({
  projectId,
  dataset,
  token,
}: TValidateTenantDocumentsParams): TSanityValidationResult[] {
  const envOverrides = {
    SANITY_STUDIO_PROJECT_ID: projectId,
    SANITY_STUDIO_DATASET: dataset,
    SANITY_AUTH_TOKEN: token,
  };

  try {
    const stdout = execFileSync(
      'pnpm',
      ['exec', 'sanity', 'documents', 'validate', '--yes', '--format', 'json'],
      {
        cwd: studioDir,
        env: { ...process.env, ...envOverrides },
        encoding: 'utf8',
      },
    );
    return JSON.parse(stdout) as TSanityValidationResult[];
  } catch (error) {
    if (isExecError(error) && typeof error.stdout === 'string') {
      return JSON.parse(error.stdout) as TSanityValidationResult[];
    }
    throw error;
  }
}
