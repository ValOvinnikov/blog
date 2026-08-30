/**
 * Pure helpers for the migration tooling (`migrate.mjs`) — no filesystem or
 * network access, so these are unit-testable in isolation. Everything here is
 * deterministic given its inputs (dates are passed in, never read from
 * `Date.now()` internally, except as a default parameter).
 *
 * Migration id shape: `YYYYMMDDTHHmm-<slug>` (UTC), e.g.
 * `20260710T1200-unify-links`. Un-timestamped legacy folder names (no leading
 * `YYYYMMDDTHHmm-`) sort before every timestamped id — see
 * `compareMigrationIds`.
 */

const TIMESTAMPED_ID_PATTERN = /^\d{8}T\d{4}-/;

/**
 * Slugify free text into a dash-separated, lowercase, id-safe fragment.
 *   slugify('unify links') -> 'unify-links'
 */
export const slugify = (input) =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** UTC `YYYYMMDDTHHmm` for a given date (defaults to now). */
export const formatTimestamp = (date = new Date()) => {
  const iso = date.toISOString(); // e.g. 2026-07-10T12:05:00.000Z
  const datePart = iso.slice(0, 10).replace(/-/g, '');
  const timePart = iso.slice(11, 16).replace(':', '');
  return `${datePart}T${timePart}`;
};

/** Build a timestamped migration id from a free-text name. */
export const timestampedId = (name, date = new Date()) =>
  `${formatTimestamp(date)}-${slugify(name)}`;

/** Whether an id has the `YYYYMMDDTHHmm-` prefix. */
export const isTimestamped = (id) => TIMESTAMPED_ID_PATTERN.test(id);

/**
 * The slug portion of an id, with any timestamp prefix stripped — lets
 * `migrate new` recognize "the same migration" across re-runs regardless of
 * when each was created.
 */
export const slugOf = (id) =>
  isTimestamped(id) ? id.replace(TIMESTAMPED_ID_PATTERN, '') : id;

/**
 * Order migration ids for deterministic run order: legacy (un-timestamped)
 * ids first (in the order they were authored, pre-dating this scheme), then
 * timestamped ids in chronological order (the zero-padded UTC format sorts
 * lexicographically = chronologically).
 */
export const compareMigrationIds = (a, b) => {
  const aTimestamped = isTimestamped(a);
  const bTimestamped = isTimestamped(b);
  if (aTimestamped !== bTimestamped) return aTimestamped ? 1 : -1;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

/** Sort migration ids into deterministic run order (see `compareMigrationIds`). */
export const sortMigrationIds = (ids) => [...ids].sort(compareMigrationIds);

/** Extract applied ids from a `migrationState` ledger document (or `undefined`). */
export const appliedIdsFromLedger = (ledger) =>
  (ledger?.applied ?? []).map((entry) => entry.id);

/**
 * `pending = sortedFolderMigrations - ledger.applied`, in run order. Safe
 * no-op (returns `[]`) when `folderIds` is empty.
 */
export const computePending = (folderIds, appliedIds) => {
  const applied = new Set(appliedIds);
  return sortMigrationIds(folderIds).filter((id) => !applied.has(id));
};

/** Build a `migrationState.applied[]` entry for a successfully-applied migration. */
export const buildLedgerEntry = (id, { runAt, sha }) => ({ id, runAt, sha });
