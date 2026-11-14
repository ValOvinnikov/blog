import {
  pageHref,
  SANITY_WEBHOOK_OPERATION,
  type TMaybeNull,
  type TMaybeUndefined,
} from '@blog/config';
import type { TTenantSanityContext } from '@blog/service';
import { errorResult, okResult, type TResult } from '@blog/utils';
import {
  DOCUMENT_NOT_FOUND_REASON,
  type FETCH_FAILED_REASON,
  PATH_UNDERIVABLE_REASON,
} from '@web/constants/revalidate';
import { derivePostPublishPaths } from '@web/server/revalidate/derive-post-publish-paths/derive-post-publish-paths';
import { deriveTenantSitePaths } from '@web/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths';

export const POST_TYPE = 'page_post';

// A redirect's old path and a page-size change's dropped pages are not in any list.
const UNDERIVABLE_TYPES = new Set(['redirect', 'module_postList']);

export type TDeriveRevalidatePathsResult = TResult<
  string[],
  typeof FETCH_FAILED_REASON | typeof PATH_UNDERIVABLE_REASON
>;

export type TDeriveRevalidatePathsInput = {
  type: string;
  id: string;
  slug: TMaybeUndefined<string>;
  operation: TMaybeNull<string>;
  tenantId: string;
  tenant: TTenantSanityContext;
};

const isUnderivable = (type: string, operation: TMaybeNull<string>) =>
  UNDERIVABLE_TYPES.has(type) ||
  (type !== POST_TYPE && operation === SANITY_WEBHOOK_OPERATION.DELETE);

export const deriveRevalidatePaths = async (
  input: TDeriveRevalidatePathsInput,
): Promise<TDeriveRevalidatePathsResult> => {
  const { type, slug, operation, tenantId, tenant } = input;
  if (isUnderivable(type, operation)) {
    return errorResult(PATH_UNDERIVABLE_REASON);
  }
  const tenantSite = { tenantId, tenant, documentHref: pageHref(type, slug) };
  if (type !== POST_TYPE) {
    return deriveTenantSitePaths(tenantSite);
  }

  const postPaths = await derivePostPublishPaths(input);
  if (postPaths.ok) {
    return okResult(postPaths.data);
  }
  if (postPaths.error !== DOCUMENT_NOT_FOUND_REASON) {
    return errorResult(postPaths.error);
  }
  return deriveTenantSitePaths(tenantSite);
};
