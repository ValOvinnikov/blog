import {
  RELEASE_CHANGE,
  RELEASE_WATCHED_PATHS,
  type TReleaseChange,
} from '@blog/config';
import type { TChangedFile } from '@platform/server/github/compare-commits';

export type TReleaseChanges = Record<TReleaseChange, boolean>;

/** A truncated file list counts as touching every set, so nothing is missed. */
export const classifyReleaseChanges = (
  files: TChangedFile[],
  isFileListTruncated: boolean,
): TReleaseChanges => {
  const touches = (change: TReleaseChange): boolean =>
    isFileListTruncated ||
    files.some(({ filename }) =>
      RELEASE_WATCHED_PATHS[change].some((prefix) =>
        filename.startsWith(prefix),
      ),
    );

  return {
    [RELEASE_CHANGE.RENDERING]: touches(RELEASE_CHANGE.RENDERING),
    [RELEASE_CHANGE.DB_MIGRATION]: touches(RELEASE_CHANGE.DB_MIGRATION),
    [RELEASE_CHANGE.SANITY_MIGRATION]: touches(RELEASE_CHANGE.SANITY_MIGRATION),
    [RELEASE_CHANGE.ENV]: touches(RELEASE_CHANGE.ENV),
  };
};
