import {
  pageHref,
  type TMaybeNull,
  type TMaybeUndefined,
} from '@shinefold/config';
import type { TTenantSanityContext } from '@shinefold/service';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import {
  DOCUMENT_NOT_FOUND_REASON,
  type FETCH_FAILED_REASON,
} from '@web/constants/revalidate';
import { buildRedirectPaths } from '@web/server/revalidate/build-redirect-paths/build-redirect-paths';
import { derivePostPublishPaths } from '@web/server/revalidate/derive-post-publish-paths/derive-post-publish-paths';
import { deriveTenantSitePaths } from '@web/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths';
import type { IRevalidateWebhookRedirect } from '@web/server/revalidate/is-revalidate-webhook-body/is-revalidate-webhook-body';
import type { TRenamedDocument } from '@web/utils/build-renamed-document-hrefs';

export const POST_TYPE = 'page_post';

export type TDeriveRevalidatePathsResult = TResult<
  string[],
  typeof FETCH_FAILED_REASON
>;

export type TDeriveRevalidatePathsInput = {
  type: string;
  id: string;
  slug: TMaybeUndefined<string>;
  previousSlug: TMaybeUndefined<string>;
  operation: TMaybeNull<string>;
  redirect: IRevalidateWebhookRedirect;
  tenantId: string;
  tenant: TTenantSanityContext;
};

const toRenamedDocument = ({
  type,
  slug,
  previousSlug,
}: TDeriveRevalidatePathsInput): TMaybeUndefined<TRenamedDocument> =>
  slug && previousSlug && previousSlug !== slug
    ? { type, slug, previousSlug }
    : undefined;

export const deriveRevalidatePaths = async (
  input: TDeriveRevalidatePathsInput,
): Promise<TDeriveRevalidatePathsResult> => {
  const { type, id, slug, operation, redirect, tenantId, tenant } = input;
  const renamedDocument = toRenamedDocument(input);
  const tenantSite = {
    tenantId,
    tenant,
    documentHref: pageHref(type, slug),
    localizedDocumentPaths: buildRedirectPaths(operation, redirect),
    renamedDocument,
  };
  if (type !== POST_TYPE) {
    return deriveTenantSitePaths(tenantSite);
  }

  const postPaths = await derivePostPublishPaths({
    id,
    tenantId,
    tenant,
    previousSlug: renamedDocument?.previousSlug,
  });
  if (postPaths.ok) {
    return okResult(postPaths.data);
  }
  if (postPaths.error !== DOCUMENT_NOT_FOUND_REASON) {
    return errorResult(postPaths.error);
  }
  return deriveTenantSitePaths(tenantSite);
};
