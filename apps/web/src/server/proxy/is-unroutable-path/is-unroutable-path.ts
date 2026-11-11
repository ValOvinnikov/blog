import { DRAFT_PREVIEW_MARKER_PATTERN } from '@web/server/draft-preview/constants/constants';
import { isTenantShapedPathSegment } from '@web/utils/is-tenant-shaped-path-segment';

/** Internal route segments — a tenant id or the draft marker — are never addressable from outside. */
export const isUnroutablePath = (
  pathname: string,
  firstSegment: string,
): boolean =>
  isTenantShapedPathSegment(firstSegment) ||
  DRAFT_PREVIEW_MARKER_PATTERN.test(pathname);
