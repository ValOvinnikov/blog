import { routes } from '@blog/config';
import { toTenantScopedPath } from '@web/utils/to-tenant-scoped-path';

export type TBuildPostPublishPathsInput = {
  tenantId: string;
  locales: readonly string[];
  postSlug: string;
  tagSlugs: string[];
  topicSlugs: string[];
  blogIndexPageParams: { page: string }[];
  tagPaginationParams: { slug: string; page: string }[];
  topicPaginationParams: { slug: string; page: string }[];
};

/**
 * Every tenant-scoped, resolved path a published `blog_post` can affect:
 * its own detail page, the home and blog archive (with pagination), and
 * every tag/topic page of the tenant (with their own pagination) — not
 * only the ones this post currently belongs to, since a tag/topic
 * reassignment leaves stale HTML on the page the post was removed from.
 */
export const buildPostPublishPaths = (
  input: TBuildPostPublishPathsInput,
): string[] => {
  const {
    tenantId,
    locales,
    postSlug,
    tagSlugs,
    topicSlugs,
    blogIndexPageParams,
    tagPaginationParams,
    topicPaginationParams,
  } = input;

  const unprefixedPaths = [
    routes.home(),
    routes.blogIndex(),
    ...blogIndexPageParams.map((params) =>
      routes.blogIndex(Number(params.page)),
    ),
    routes.post(postSlug),
    ...tagSlugs.map((slug) => routes.tag(slug)),
    ...tagPaginationParams.map((tagPage) =>
      routes.tag(tagPage.slug, Number(tagPage.page)),
    ),
    ...topicSlugs.map((slug) => routes.topic(slug)),
    ...topicPaginationParams.map((topicPage) =>
      routes.topic(topicPage.slug, Number(topicPage.page)),
    ),
  ];

  const scopedPaths = locales.flatMap((locale) =>
    unprefixedPaths.map((path) => toTenantScopedPath(tenantId, locale, path)),
  );

  return Array.from(new Set(scopedPaths));
};
