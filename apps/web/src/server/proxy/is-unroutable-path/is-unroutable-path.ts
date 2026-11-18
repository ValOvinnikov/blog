import { DRAFT_PREVIEW_MARKER_PATTERN } from '@web/server/draft-preview/constants/constants';
import { isTenantShapedPathSegment } from '@web/utils/is-tenant-shaped-path-segment';

const ASCII_ESCAPE_PATTERN = /%([0-7][0-9a-f])/gi;
const HEX_RADIX = 16;

// ASCII escapes only, so a malformed multi-byte sequence elsewhere in the path cannot make decoding throw.
const decodeAsciiEscapesFully = (pathname: string): string => {
  let decoded = pathname;
  let previous: string;
  do {
    previous = decoded;
    decoded = previous.replace(ASCII_ESCAPE_PATTERN, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, HEX_RADIX)),
    );
  } while (decoded !== previous);
  return decoded;
};

/** Internal route segments — a tenant id or the draft marker, however encoded — are never addressable from outside. */
export const isUnroutablePath = (
  pathname: string,
  firstSegment: string,
): boolean =>
  isTenantShapedPathSegment(firstSegment) ||
  DRAFT_PREVIEW_MARKER_PATTERN.test(decodeAsciiEscapesFully(pathname));
