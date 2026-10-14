export type TProvisioningErrorKind =
  'permission' | 'duplicate' | 'network' | 'unknown';

const PERMISSION_PATTERN = /\b403\b|forbidden|missing permission/i;
const DUPLICATE_STATUS_PATTERN = /\b400\b/;
const DUPLICATE_KEYWORD_PATTERN = /already|duplicate|in use|taken|exists/i;
const NETWORK_PATTERN =
  /time(d)? ?out|econnreset|econnrefused|enotfound|network error|fetch failed|aborted/i;

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
