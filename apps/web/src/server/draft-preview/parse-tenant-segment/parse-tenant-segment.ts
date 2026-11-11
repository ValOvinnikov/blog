import type { TMaybeUndefined } from '@blog/config';
import { DRAFT_PREVIEW_MARKER } from '@web/server/draft-preview/constants/constants';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';

type TTenantSegment = {
  tenantId: TMaybeUndefined<string>;
  isDraftPreview: boolean;
};

export const parseTenantSegment = (segment: string): TTenantSegment => {
  if (segment.endsWith(DRAFT_PREVIEW_MARKER)) {
    return {
      tenantId: segment.slice(0, -DRAFT_PREVIEW_MARKER.length),
      isDraftPreview: true,
    };
  }
  return {
    tenantId: segment === UNRESOLVED_TENANT_PLACEHOLDER ? undefined : segment,
    isDraftPreview: false,
  };
};
