export interface IReleaseVersion {
  major: number;
  minor: number;
  patch: number;
}

const RELEASE_VERSION_PATTERN = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export const parseReleaseVersion = (tag: string): IReleaseVersion | null => {
  const match = RELEASE_VERSION_PATTERN.exec(tag);

  if (!match) {
    return null;
  }

  const [, major, minor, patch] = match;

  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
};

export const isReleaseVersionGreater = (
  candidate: string,
  current: string,
): boolean => {
  const next = parseReleaseVersion(candidate);
  const previous = parseReleaseVersion(current);

  if (!next || !previous) {
    return false;
  }

  if (next.major !== previous.major) {
    return next.major > previous.major;
  }

  if (next.minor !== previous.minor) {
    return next.minor > previous.minor;
  }

  return next.patch > previous.patch;
};
