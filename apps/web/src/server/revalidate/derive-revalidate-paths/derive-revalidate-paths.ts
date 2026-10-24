import { queries } from '@blog/db';
import { service, type TTenantSanityContext } from '@blog/service';
import { errorResult, okResult, type TResult } from '@blog/utils';
import {
  DOCUMENT_NOT_FOUND_REASON,
  FETCH_FAILED_REASON,
  REVALIDATE_LOG,
  UNSUPPORTED_TYPE_REASON,
} from '@web/constants/revalidate';
import { routing } from '@web/i18n/routing';
import { buildPostPublishPaths } from '@web/utils/build-post-publish-paths';
import { logger } from '@web/utils/logger/logger';

export const POST_TYPE = 'page_post';

const DERIVABLE_REVALIDATE_TYPES = new Set<string>([POST_TYPE]);

/** Whether `deriveRevalidatePaths` can precisely resolve paths for this document `_type` — every other type falls back to the whole-site purge. */
export const isDerivableRevalidateType = (type: string): boolean =>
  DERIVABLE_REVALIDATE_TYPES.has(type);

export type TDeriveRevalidatePathsResult = TResult<
  string[],
  | typeof UNSUPPORTED_TYPE_REASON
  | typeof DOCUMENT_NOT_FOUND_REASON
  | typeof FETCH_FAILED_REASON
>;

export type TDeriveRevalidatePathsInput = {
  type: string;
  id: string;
  tenantId: string;
  tenant: TTenantSanityContext;
};

const deriveBlogPostPublishPaths = async ({
  id,
  tenantId,
  tenant,
}: TDeriveRevalidatePathsInput): Promise<TDeriveRevalidatePathsResult> => {
  const locales = (await queries.tenants.getTenantLiveLocales(tenantId)) ?? [
    routing.defaultLocale,
  ];
  const [
    postsResult,
    blogParamsResult,
    tagSlugsResult,
    tagPaginationParamsResult,
    topicSlugsResult,
    topicPaginationParamsResult,
  ] = await Promise.all([
    service.entities.posts.v1.getPostsByIds([id], tenant),
    service.pages.blog.v1.getIndexPageParams(tenant),
    service.pages.tag.v1.getTagParams(tenant, locales),
    service.pages.tag.v1.getTagPaginationParams(tenant, locales),
    service.pages.topic.v1.getTopicParams(tenant, locales),
    service.pages.topic.v1.getTopicPaginationParams(tenant, locales),
  ]);

  if (!postsResult.ok) {
    logger.error(REVALIDATE_LOG.POST_LOOKUP_FAILED, {
      id,
      error: postsResult.error,
    });
    return errorResult(FETCH_FAILED_REASON);
  }
  const [post] = postsResult.data;
  if (!post) {
    return errorResult(DOCUMENT_NOT_FOUND_REASON);
  }

  if (!blogParamsResult.ok) {
    logger.error(REVALIDATE_LOG.BLOG_PAGINATION_LOOKUP_FAILED, {
      id,
      error: blogParamsResult.error,
    });
    return errorResult(FETCH_FAILED_REASON);
  }
  if (!tagSlugsResult.ok) {
    logger.error(REVALIDATE_LOG.TAG_PARAMS_LOOKUP_FAILED, {
      id,
      error: tagSlugsResult.error,
    });
    return errorResult(FETCH_FAILED_REASON);
  }
  if (!tagPaginationParamsResult.ok) {
    logger.error(REVALIDATE_LOG.TAG_PAGINATION_LOOKUP_FAILED, {
      id,
      error: tagPaginationParamsResult.error,
    });
    return errorResult(FETCH_FAILED_REASON);
  }
  if (!topicSlugsResult.ok) {
    logger.error(REVALIDATE_LOG.TOPIC_PARAMS_LOOKUP_FAILED, {
      id,
      error: topicSlugsResult.error,
    });
    return errorResult(FETCH_FAILED_REASON);
  }
  if (!topicPaginationParamsResult.ok) {
    logger.error(REVALIDATE_LOG.TOPIC_PAGINATION_LOOKUP_FAILED, {
      id,
      error: topicPaginationParamsResult.error,
    });
    return errorResult(FETCH_FAILED_REASON);
  }

  const paths = buildPostPublishPaths({
    tenantId,
    locales,
    postSlug: post.slug,
    tagSlugs: tagSlugsResult.data.map(({ slug }) => slug),
    topicSlugs: topicSlugsResult.data.map(({ slug }) => slug),
    blogIndexPageParams: blogParamsResult.data,
    tagPaginationParams: tagPaginationParamsResult.data,
    topicPaginationParams: topicPaginationParamsResult.data,
  });

  return okResult(paths);
};

/**
 * Resolves the tenant-scoped, resolved paths a published document affects,
 * for the webhook to purge individually instead of the whole site. Only
 * `page_post` is precisely derived today — every other `_type` reports
 * `unsupported_type` so the caller falls back to the whole-site purge.
 */
export const deriveRevalidatePaths = async (
  input: TDeriveRevalidatePathsInput,
): Promise<TDeriveRevalidatePathsResult> => {
  if (input.type === POST_TYPE) {
    return deriveBlogPostPublishPaths(input);
  }
  return errorResult(UNSUPPORTED_TYPE_REASON);
};
