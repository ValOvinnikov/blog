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

/** The only dataset this script is ever allowed to wipe documents from and write to. */
export const TARGET_DATASET = 'development';

/**
 * GROQ filter for "every document `wipeDataset` is allowed to touch": all of
 * them EXCEPT Sanity's own system documents. System document `_id`s live
 * under the reserved `_.` namespace (`_.schemas.default`,
 * `_.groups.administrator`, `_.retention._maximum_project`, ...) — confirmed
 * against a real dataset via `sanity documents query
 * '*[_id in path("_.**")]{_id,_type}'`, which returned exactly the documents
 * whose `_type` also starts with `system.` (13/13 in that check, no false
 * positives/negatives against the dataset's other 29 ordinary documents).
 * Deleting a system document requires the project's `manage` permission; an
 * unscoped `*[]` matches them too and fails the whole wipe with
 * "Insufficient permissions; permission 'manage' required" even though the
 * token has full Editor rights on ordinary content.
 *
 * This uses `string::startsWith(_id, "_.")`, NOT `_id in path("_.**")`,
 * despite both looking equivalent: groq-js's `path()` compiles a pattern by
 * splitting on `.` and then re-joining the per-segment regex fragments with
 * an UNESCAPED `.` (see groq-js `src/shared/values/Path.ts`'s `pathRegExp`),
 * so `"_.**"` compiles to the regex `^_..*$` — a literal `_`, then the `.`
 * regex metacharacter (matches ANY character, not just a literal dot), then
 * `.*`. That regex matches any `_id` starting with `_` followed by at least
 * one more character — e.g. it would ALSO match a hypothetical `_foo` or
 * `__bar` singleton id, silently excluding it from every future wipe.
 * `string::startsWith` does a literal prefix check with no regex step, so it
 * excludes exactly (and only) `_.`-namespaced ids. Verified directly against
 * groq-js: both forms agree on today's real system-document ids, but only
 * `string::startsWith` correctly *includes* a synthetic `_foo`/`__bar` id in
 * the wipe — see the co-located test.
 */
export const WIPE_QUERY = '*[!string::startsWith(_id, "_.")]';

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
