import {
  RELEASE_FIELD_ERROR,
  type TReleaseFieldError,
} from '@platform/constants/release';
import type { TMaybeUndefined } from '@shinefold/config';
import {
  isReleaseVersionGreater,
  parseReleaseVersion,
} from '@shinefold/utils/version';

export const releaseVersionError = (
  version: string,
  lastTag: string,
): TMaybeUndefined<TReleaseFieldError> => {
  if (!parseReleaseVersion(version)) {
    return RELEASE_FIELD_ERROR.VERSION_MALFORMED;
  }
  if (!isReleaseVersionGreater(version, lastTag)) {
    return RELEASE_FIELD_ERROR.VERSION_NOT_GREATER;
  }
  return undefined;
};
