import type { TMaybeUndefined } from '@blog/config';
import type { TTenantSanityContext } from '@blog/service';
import { errorResult, okResult, type TResult } from '@blog/utils';
import {
  DOCUMENT_NOT_FOUND_REASON,
  type FETCH_FAILED_REASON,
} from '@web/constants/revalidate';
import { derivePostPublishPaths } from '@web/server/revalidate/derive-post-publish-paths/derive-post-publish-paths';
import { deriveTenantSitePaths } from '@web/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths';

export const POST_TYPE = 'page_post';

export type TDeriveRevalidatePathsResult = TResult<
  string[],
  typeof FETCH_FAILED_REASON
>;

export type TDeriveRevalidatePathsInput = {
  type: string;
  id: string;
  slug: TMaybeUndefined<string>;
  tenantId: string;
  tenant: TTenantSanityContext;
};

/** The resolved paths of the publishing tenant that a document change affects: a live post's own set, otherwise every page the tenant renders. */
export const deriveRevalidatePaths = async (
  input: TDeriveRevalidatePathsInput,
): Promise<TDeriveRevalidatePathsResult> => {
  const { type, slug, tenantId, tenant } = input;
  if (type !== POST_TYPE) {
    return deriveTenantSitePaths({ tenantId, tenant });
  }

  const postPaths = await derivePostPublishPaths(input);
  if (postPaths.ok) {
    return okResult(postPaths.data);
  }
  if (postPaths.error !== DOCUMENT_NOT_FOUND_REASON) {
    return errorResult(postPaths.error);
  }
  return deriveTenantSitePaths({ tenantId, tenant, removedPostSlug: slug });
};
