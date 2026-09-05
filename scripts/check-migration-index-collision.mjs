// Fails when a Drizzle migration index on this branch is already taken on
// `main` by a different migration. drizzle-kit numbers each migration
// sequentially from whatever is on `main` at `db:generate` time, so two
// branches that generate concurrently both claim the same index — an add/add
// conflict on `meta/<idx>_snapshot.json` plus a content conflict on
// `meta/_journal.json` for whichever merges second.
//
// Nothing else surfaces that until merge time: the PR opens green and the
// collision only appears once `main` moves underneath it, by which point a
// conflicted PR produces no merge ref and its `pull_request` checks stop
// running altogether. This check moves discovery to PR time, while the fix is
// still one cheap regenerate.
//
// Compares this branch's `meta/_journal.json` against `origin/main`'s: an idx
// present on both sides under a different tag is a collision. Distinct
// indices, and a branch that adds no migration at all, report nothing.
//
// Run with `pnpm check:migration-index`. Read-only; exits 1 on any collision.
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');

export const JOURNAL_PATH = 'packages/db/migrations/meta/_journal.json';
export const BASE_REF = 'origin/main';

export const RENUMBER_DOC = 'packages/db/README.md';
export const RENUMBER_SECTION =
  'Renumbering a migration that collides with `main`';

// The idx -> tag pairs recorded in a drizzle-kit `meta/_journal.json`.
export const readJournalTags = (journalText) => {
  const { entries } = JSON.parse(journalText);
  return new Map((entries ?? []).map(({ idx, tag }) => [idx, tag]));
};

// Indices carrying one tag on the base ref and a different one here — two
// migrations generated against the same base, only one of which can keep the
// number.
export const findCollisions = (baseTags, headTags) =>
  [...headTags]
    .filter(([idx, tag]) => baseTags.has(idx) && baseTags.get(idx) !== tag)
    .map(([idx, tag]) => ({ idx, baseTag: baseTags.get(idx), headTag: tag }))
    .sort((a, b) => a.idx - b.idx);

export const formatReport = (collisions, baseRef = BASE_REF) =>
  [
    `Drizzle migration index already taken on ${baseRef}:`,
    ...collisions.map(
      ({ idx, baseTag, headTag }) =>
        `  index ${String(idx).padStart(4, '0')} is ${baseTag} on ${baseRef}, but ${headTag} on this branch`,
    ),
    '',
    `Two migrations cannot share an index. ${baseRef} got there first, so this branch's ` +
      `migration has to be regenerated under the next free index — merge ${baseRef}, delete ` +
      'the colliding .sql and its snapshot, and re-run `pnpm --filter @blog/db db:generate`. ' +
      `Full procedure: "${RENUMBER_SECTION}" in ${RENUMBER_DOC}.`,
  ].join('\n');

const git = (args) =>
  execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });

const revExists = (ref) => {
  try {
    git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    return true;
  } catch {
    return false;
  }
};

const showFileAtRef = (ref, path) => {
  try {
    return git(['show', `${ref}:${path}`]);
  } catch {
    return null;
  }
};

const main = () => {
  if (!revExists(BASE_REF)) {
    console.error(
      `Cannot resolve ${BASE_REF}, so this branch's migrations have nothing to be compared against.\n` +
        'Fetch it first: git fetch --no-tags origin +refs/heads/main:refs/remotes/origin/main',
    );
    process.exit(1);
  }

  const headTags = readJournalTags(
    readFileSync(join(repoRoot, JOURNAL_PATH), 'utf8'),
  );
  const baseJournal = showFileAtRef(BASE_REF, JOURNAL_PATH);
  const baseTags = baseJournal ? readJournalTags(baseJournal) : new Map();

  const collisions = findCollisions(baseTags, headTags);
  if (collisions.length) {
    console.error(formatReport(collisions));
    process.exit(1);
  }

  console.log(
    `No Drizzle migration index collides with ${BASE_REF} (${headTags.size} migrations on this branch).`,
  );
};

// Only run when invoked as a script — the fixture tests import this module.
if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
