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
 * Replace semantics: full replace, including assets. Every ORDINARY document
 * in the development dataset — content documents AND `sanity.imageAsset`/
 * `sanity.fileAsset` assets, since assets are themselves documents — is
 * wiped via the Data Mutations HTTP API (a query-based `delete: { query:
 * "*[!(_id in path(\"_.**\"))]" }` mutation, issued through `@sanity/client`)
 * before the import, so every refresh starts clean — no asset/document
 * accumulation across repeated runs. The `_id in path("_.**")` exclusion
 * skips Sanity's own system documents (schema-store manifests like
 * `_.schemas.default`, role/group definitions like `_.groups.administrator`,
 * retention policy docs like `_.retention._maximum_project` — every system
 * document's `_id` lives under the reserved `_.` namespace and its `_type`
 * starts with `system.`; verified empirically against a real dataset with
 * `sanity documents query '*[_id in path("_.**")]{_id,_type}'`). Deleting
 * those requires the project's `manage` permission — which an Editor-scoped
 * token doesn't have and this script has no reason to touch, since they
 * aren't content. An unscoped `*[]` matches them too and 403s the whole wipe
 * (see the "why" note on `wipeDataset` below). This does NOT delete/recreate
 * the dataset itself (no `sanity datasets delete`/`create`): only
 * document-level writes, which only need Editor-level access — see the token
 * note below.
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
 *   SANITY_DEV_IMPORT_TOKEN   - token with document read/write access to the
 *                                target project's `development` dataset
 *                                (Editor permission is sufficient — this
 *                                script only ever wipes and imports
 *                                documents, it never deletes or creates the
 *                                dataset itself, so no dataset-management
 *                                grant is required)
 *
 * This assumes the `development` dataset already exists (per docs/DEPLOY.md's
 * one-time setup) — if it doesn't, the wipe step fails loudly, which is the
 * correct behavior rather than silently masking a misconfiguration.
 */
import { createClient } from '@sanity/client';
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

// Pinned so the client's request-building/response-shape behavior doesn't
// silently drift underneath this script.
const WIPE_API_VERSION = '2024-08-01';

/**
 * GROQ filter for "every document this script is allowed to touch": all of
 * them EXCEPT Sanity's own system documents. System document `_id`s live
 * under the reserved `_.` namespace (`_.schemas.default`,
 * `_.groups.administrator`, `_.retention._maximum_project`, ...) — confirmed
 * against a real dataset via `sanity documents query
 * '*[_id in path("_.**")]{_id,_type}'`, which returned exactly the documents
 * whose `_type` also starts with `system.` (13/13 in that check, no
 * false positives/negatives against the dataset's other 29 ordinary
 * documents). Deleting a system document requires the project's `manage`
 * permission; an unscoped `*[]` matches them too and fails the whole wipe
 * with "Insufficient permissions; permission 'manage' required" even though
 * the token has full Editor rights on ordinary content. Excluding them here
 * keeps the wipe at Editor-level access, matching the token note above.
 */
const WIPE_QUERY = '*[!(_id in path("_.**"))]';

/**
 * Delete every non-system document in `dataset` via the Data Mutations HTTP
 * API's query-based `delete` mutation (`{ delete: { query } }`, POSTed to
 * `/data/mutate/<dataset>` by `@sanity/client`'s `client.delete()`).
 * `WIPE_QUERY` matches every ordinary document, including
 * `sanity.imageAsset`/`sanity.fileAsset` (assets are documents too), so one
 * call empties the whole dataset of content while leaving Sanity's own
 * system documents untouched. This only requires document-level write
 * access (Editor is sufficient) — unlike `sanity datasets delete`, which
 * needs a dataset-management grant that isn't available on this project's
 * plan (see the module docstring).
 */
const wipeDataset = async (projectId, dataset, token) => {
  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: WIPE_API_VERSION,
    useCdn: false,
  });
  const result = await client.delete(
    { query: WIPE_QUERY },
    { returnDocuments: false },
  );
  console.log(
    `Deleted ${result.results.length} document(s) from "${dataset}" (project ${projectId}).`,
  );
};

const main = async () => {
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
      `Wiping all documents in "${TARGET_DATASET}" (project ${targetProjectId}) so the refresh starts clean...`,
    );
    await wipeDataset(targetProjectId, TARGET_DATASET, targetToken);

    console.log(
      `Importing ${exportFile} -> "${TARGET_DATASET}" (project ${targetProjectId})...`,
    );
    // --replace is a defensive no-op here (the dataset was just emptied by the
    // wipe above) but keeps this idempotent if a re-run ever skips the wipe
    // step for some reason.
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
