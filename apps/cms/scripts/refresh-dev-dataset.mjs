#!/usr/bin/env node
/**
 * Refresh the `development` Sanity dataset from a fresh copy of `production`
 * — a cross-PROJECT export + import (dev and prod are separate Sanity
 * projects, not just separate datasets in one project; see docs/DEPLOY.md).
 * `sanity dataset copy` is same-project only and doesn't apply here.
 *
 *   pnpm --filter cms dataset:refresh-dev
 *
 * Manual, human-gated — run this ONLY after confirming that release's
 * production migrations have already finished (never in parallel with or
 * before them). See apps/cms/migrations/README.md and docs/DEPLOY.md for the
 * full release sequence. This script is invoked by the `Refresh Dev Dataset`
 * GitHub Actions workflow, which is `workflow_dispatch`-only — it never runs
 * automatically.
 *
 * Direction is fixed: production (source) -> development (target), never
 * configurable to run in reverse. `assertSafeDatasetRefresh` (see
 * ./refresh-dev-dataset-lib.mjs) refuses to proceed unless the target dataset
 * is literally "development", the source dataset is literally "production",
 * and the source/target project ids are both present and different — this
 * runs BEFORE any network call, so a misconfigured run fails loudly without
 * touching either project.
 *
 * Replace semantics: full replace, including assets. The development dataset
 * is deleted and recreated empty before the import, so every refresh starts
 * clean — no asset/document accumulation across repeated runs.
 *
 * Drafts: published-only. `--no-drafts` on export means prod's unpublished
 * draft documents never leak into development.
 *
 * Required env (never hardcoded, never committed — see docs/DEPLOY.md):
 *   SANITY_PROD_PROJECT_ID    - source (production) Sanity project id
 *   SANITY_PROD_EXPORT_TOKEN  - token with read access to the production
 *                                dataset (Viewer permission is sufficient for
 *                                an export)
 *   SANITY_DEV_PROJECT_ID     - target (development) Sanity project id
 *   SANITY_DEV_IMPORT_TOKEN   - token with permission to delete, create, and
 *                                import into the target project's
 *                                `development` dataset (deleting/creating a
 *                                dataset needs more than Editor — use an
 *                                Administrator-scope token)
 *
 * This assumes the `development` dataset already exists (per docs/DEPLOY.md's
 * one-time setup) — if it doesn't, the delete step fails loudly, which is the
 * correct behavior rather than silently masking a misconfiguration.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  assertSafeDatasetRefresh,
  SOURCE_DATASET,
  TARGET_DATASET,
} from './refresh-dev-dataset-lib.mjs';

const cmsDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    fail(
      `Missing required env ${name}. Set it as an environment-scoped GitHub ` +
        'Actions secret/variable for the workflow that runs this script (see ' +
        'docs/DEPLOY.md) — never commit it.',
    );
  }
  return value;
};

const runSanity = (args, envOverrides) => {
  execFileSync('pnpm', ['exec', 'sanity', ...args], {
    cwd: cmsDir,
    stdio: 'inherit',
    env: { ...process.env, ...envOverrides },
  });
};

const main = () => {
  const sourceProjectId = requireEnv('SANITY_PROD_PROJECT_ID');
  const sourceToken = requireEnv('SANITY_PROD_EXPORT_TOKEN');
  const targetProjectId = requireEnv('SANITY_DEV_PROJECT_ID');
  const targetToken = requireEnv('SANITY_DEV_IMPORT_TOKEN');

  // Throws before any network call if the direction is anything other than
  // production -> development, or if either project id is missing/identical.
  assertSafeDatasetRefresh({
    sourceProjectId,
    sourceDataset: SOURCE_DATASET,
    targetProjectId,
    targetDataset: TARGET_DATASET,
  });

  const sourceEnv = {
    SANITY_STUDIO_PROJECT_ID: sourceProjectId,
    SANITY_STUDIO_DATASET: SOURCE_DATASET,
    SANITY_AUTH_TOKEN: sourceToken,
  };
  const targetEnv = {
    SANITY_STUDIO_PROJECT_ID: targetProjectId,
    SANITY_STUDIO_DATASET: TARGET_DATASET,
    SANITY_AUTH_TOKEN: targetToken,
  };

  const workDir = mkdtempSync(join(tmpdir(), 'sanity-dev-refresh-'));
  const exportFile = join(workDir, `${SOURCE_DATASET}.tar.gz`);

  try {
    console.log(
      `Exporting published documents from "${SOURCE_DATASET}" (project ${sourceProjectId}) -> ${exportFile}`,
    );
    // --no-drafts: published-only, by design (see module docstring).
    runSanity(
      ['datasets', 'export', SOURCE_DATASET, exportFile, '--no-drafts'],
      sourceEnv,
    );

    console.log(
      `Deleting "${TARGET_DATASET}" (project ${targetProjectId}) so the refresh starts clean...`,
    );
    runSanity(['datasets', 'delete', TARGET_DATASET, '--force'], targetEnv);

    console.log(
      `Recreating empty "${TARGET_DATASET}" (project ${targetProjectId})...`,
    );
    runSanity(
      ['datasets', 'create', TARGET_DATASET, '--visibility', 'public'],
      targetEnv,
    );

    console.log(
      `Importing ${exportFile} -> "${TARGET_DATASET}" (project ${targetProjectId})...`,
    );
    // --replace is a defensive no-op here (the dataset was just emptied by the
    // delete+create above) but keeps this idempotent if a re-run ever skips
    // the delete step for some reason.
    runSanity(
      [
        'datasets',
        'import',
        exportFile,
        '--dataset',
        TARGET_DATASET,
        '--replace',
      ],
      targetEnv,
    );

    console.log(
      `Done — "${TARGET_DATASET}" now mirrors the published documents in "${SOURCE_DATASET}".`,
    );
  } finally {
    if (existsSync(workDir)) {
      rmSync(workDir, { recursive: true, force: true });
    }
  }
};

main();
