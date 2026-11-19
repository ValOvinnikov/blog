import type { TMaybeUndefined } from '@shinefold/config';
import { isUndefined } from '@shinefold/utils/primitives';
import { DRAFT_PREVIEW_MARKER_PATTERN } from '@web/server/draft-preview/constants/constants';
import { isTenantShapedPathSegment } from '@web/utils/is-tenant-shaped-path-segment';

const ASCII_ESCAPE_PATTERN = /%([0-7][0-9a-f])/gi;
const HEX_RADIX = 16;
// No real address nests its encoding this deep; a cap keeps a crafted `%2525…` path linear.
const MAX_DECODE_PASSES = 4;

// ASCII escapes only, so a malformed multi-byte sequence elsewhere in the path cannot make decoding throw.
const decodeAsciiEscapesFully = (pathname: string): TMaybeUndefined<string> => {
  let decoded = pathname;
  for (let pass = 0; pass <= MAX_DECODE_PASSES; pass += 1) {
    const next = decoded.replace(ASCII_ESCAPE_PATTERN, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, HEX_RADIX)),
    );
    if (next === decoded) {
      return decoded;
    }
    decoded = next;
  }
  return undefined;
};

/** Internal route segments — a tenant id or the draft marker, however encoded — are never addressable from outside. */
export const isUnroutablePath = (
  pathname: string,
  firstSegment: string,
): boolean => {
  if (isTenantShapedPathSegment(firstSegment)) {
    return true;
  }
  const decoded = decodeAsciiEscapesFully(pathname);
  return isUndefined(decoded) || DRAFT_PREVIEW_MARKER_PATTERN.test(decoded);
};
