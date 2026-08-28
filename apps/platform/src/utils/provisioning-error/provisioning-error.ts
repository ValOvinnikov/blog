export type TProvisioningErrorKind =
  'permission' | 'duplicate' | 'network' | 'unknown';

const PERMISSION_PATTERN = /\b403\b|forbidden|missing permission/i;
const DUPLICATE_STATUS_PATTERN = /\b400\b/;
const DUPLICATE_KEYWORD_PATTERN = /already|duplicate|in use|taken|exists/i;
const NETWORK_PATTERN =
  /time(d)? ?out|econnreset|econnrefused|enotfound|network error|fetch failed|aborted/i;

/**
 * Classifies a provisioning step's raw failure text (thrown from
 * `packages/db`'s provision-tenant script, e.g. `"Sanity Access API POST
 * /access/project/<id>/invites failed: 403 {...}"`) into a shape the UI maps
 * to a written explanation. An unrecognised shape falls back to `'unknown'`
 * rather than throwing, so the operator always sees a friendly headline with
 * the raw text still available underneath.
 */
export const classifyProvisioningError = (
  rawError: string | undefined,
): TProvisioningErrorKind => {
  if (!rawError) return 'unknown';

  if (PERMISSION_PATTERN.test(rawError)) return 'permission';

  if (
    DUPLICATE_STATUS_PATTERN.test(rawError) &&
    DUPLICATE_KEYWORD_PATTERN.test(rawError)
  ) {
    return 'duplicate';
  }

  if (NETWORK_PATTERN.test(rawError)) return 'network';

  return 'unknown';
};
