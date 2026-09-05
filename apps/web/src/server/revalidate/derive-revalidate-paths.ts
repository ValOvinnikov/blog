import { LOCALE_ISO_CODES } from '@blog/config';
import { service, type TTenantSanityContext } from '@blog/service';
import { buildPostPublishPaths } from '@web/utils/build-post-publish-paths';
import { logger } from '@web/utils/logger/logger';

export const BLOG_POST_TYPE = 'blog_post';

const DERIVABLE_REVALIDATE_TYPES = new Set<string>([BLOG_POST_TYPE]);

/** Whether `deriveRevalidatePaths` can precisely resolve paths for this document `_type` — every other type falls back to the whole-site purge. */
export const isDerivableRevalidateType = (type: string): boolean =>
  DERIVABLE_REVALIDATE_TYPES.has(type);

export type TDeriveRevalidatePathsResult =
  | { ok: true; paths: string[] }
  | {
      ok: false;
      reason: 'unsupported_type' | 'document_not_found' | 'fetch_failed';
    };

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
    service.pages.tag.v1.getTagParams(tenant),
    service.pages.tag.v1.getTagPaginationParams(tenant),
    service.pages.topic.v1.getTopicParams(tenant),
    service.pages.topic.v1.getTopicPaginationParams(tenant),
  ]);

  if (!postsResult.ok) {
    logger.error('revalidate.post_lookup_failed', {
      id,
      error: postsResult.error,
    });
    return { ok: false, reason: 'fetch_failed' };
  }
  const [post] = postsResult.data;
  if (!post) {
    return { ok: false, reason: 'document_not_found' };
  }

  if (!blogParamsResult.ok) {
    logger.error('revalidate.blog_pagination_lookup_failed', {
      id,
      error: blogParamsResult.error,
    });
    return { ok: false, reason: 'fetch_failed' };
  }
  if (!tagSlugsResult.ok) {
    logger.error('revalidate.tag_params_lookup_failed', {
      id,
      error: tagSlugsResult.error,
    });
    return { ok: false, reason: 'fetch_failed' };
  }
  if (!tagPaginationParamsResult.ok) {
    logger.error('revalidate.tag_pagination_lookup_failed', {
      id,
      error: tagPaginationParamsResult.error,
    });
    return { ok: false, reason: 'fetch_failed' };
  }
  if (!topicSlugsResult.ok) {
    logger.error('revalidate.topic_params_lookup_failed', {
      id,
      error: topicSlugsResult.error,
    });
    return { ok: false, reason: 'fetch_failed' };
  }
  if (!topicPaginationParamsResult.ok) {
    logger.error('revalidate.topic_pagination_lookup_failed', {
      id,
      error: topicPaginationParamsResult.error,
    });
    return { ok: false, reason: 'fetch_failed' };
  }

  const paths = buildPostPublishPaths({
    tenantId,
    locales: Object.values(LOCALE_ISO_CODES),
    postSlug: post.slug,
    tagSlugs: tagSlugsResult.data.map(({ slug }) => slug),
    topicSlugs: topicSlugsResult.data.map(({ slug }) => slug),
    blogIndexPageParams: blogParamsResult.data,
    tagPaginationParams: tagPaginationParamsResult.data,
    topicPaginationParams: topicPaginationParamsResult.data,
  });

  return { ok: true, paths };
};

/**
 * Resolves the tenant-scoped, resolved paths a published document affects,
 * for the webhook to purge individually instead of the whole site. Only
 * `blog_post` is precisely derived today — every other `_type` reports
 * `unsupported_type` so the caller falls back to the whole-site purge.
 */
export const deriveRevalidatePaths = async (
  input: TDeriveRevalidatePathsInput,
): Promise<TDeriveRevalidatePathsResult> => {
  if (input.type === BLOG_POST_TYPE) {
    return deriveBlogPostPublishPaths(input);
  }
  return { ok: false, reason: 'unsupported_type' };
};
