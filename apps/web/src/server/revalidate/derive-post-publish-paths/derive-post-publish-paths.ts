import { service, type TTenantSanityContext } from '@blog/service';
import { errorResult, okResult, type TResult } from '@blog/utils';
import {
  DOCUMENT_NOT_FOUND_REASON,
  FETCH_FAILED_REASON,
  REVALIDATE_LOG,
} from '@web/constants/revalidate';
import { resolveTenantLiveLocales } from '@web/server/tenant/tenant-live-locales/tenant-live-locales';
import { buildPostPublishPaths } from '@web/utils/build-post-publish-paths';
import { logger } from '@web/utils/logger/logger';

export type TDerivePostPublishPathsInput = {
  id: string;
  tenantId: string;
  tenant: TTenantSanityContext;
};

export const derivePostPublishPaths = async ({
  id,
  tenantId,
  tenant,
}: TDerivePostPublishPathsInput): Promise<
  TResult<
    string[],
    typeof DOCUMENT_NOT_FOUND_REASON | typeof FETCH_FAILED_REASON
  >
> => {
  const liveLocales = await resolveTenantLiveLocales(tenantId);
  if (!liveLocales.ok) {
    logger.error(REVALIDATE_LOG.LIVE_LOCALES_LOOKUP_FAILED, {
      id,
      error: liveLocales.error,
    });
    return errorResult(FETCH_FAILED_REASON);
  }
  const locales = liveLocales.data;
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
