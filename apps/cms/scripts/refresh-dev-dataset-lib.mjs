/**
 * Pure helpers for `refresh-dev-dataset.mjs` — no filesystem or network
 * access, so these are unit-testable in isolation.
 *
 * The refresh only ever flows ONE direction: production (source) ->
 * development (target). `assertSafeDatasetRefresh` is the safety guard that
 * makes it structurally impossible for a misconfigured/reversed env var to
 * write into production — it THROWS (never returns a boolean a caller could
 * forget to check) so a bad config fails loudly before any network call.
 */

/** The only dataset this script is ever allowed to read from. */
export const SOURCE_DATASET = 'production';

/** The only dataset this script is ever allowed to delete/recreate/write to. */
export const TARGET_DATASET = 'development';

/**
 * Validate a resolved refresh configuration before anything destructive runs.
 * Collects every violation (not just the first) so a misconfigured run
 * reports everything wrong in one go. Throws on any violation; callers don't
 * need (and shouldn't add) their own truthiness check on the result.
 */
export const assertSafeDatasetRefresh = ({
  sourceProjectId,
  sourceDataset,
  targetProjectId,
  targetDataset,
}) => {
  const errors = [];

  if (!sourceProjectId) {
    errors.push('Missing source (production) project id.');
  }
  if (!targetProjectId) {
    errors.push('Missing target (development) project id.');
  }
  if (sourceDataset !== SOURCE_DATASET) {
    errors.push(
      `Source dataset must be exactly "${SOURCE_DATASET}", got "${sourceDataset}".`,
    );
  }
  if (targetDataset !== TARGET_DATASET) {
    errors.push(
      `Target dataset must be exactly "${TARGET_DATASET}", got "${targetDataset}" — ` +
        'refusing to run against anything other than the development dataset.',
    );
  }
  if (
    sourceProjectId &&
    targetProjectId &&
    sourceProjectId === targetProjectId
  ) {
    errors.push(
      `Source and target project ids are identical ("${sourceProjectId}") — ` +
        'development and production are separate Sanity projects; refusing to ' +
        'risk writing into the production project.',
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `Refusing to run the dev dataset refresh:\n- ${errors.join('\n- ')}`,
    );
  }
};
