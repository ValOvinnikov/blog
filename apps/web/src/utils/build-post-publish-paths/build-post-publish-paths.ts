import { routes } from '@blog/config';
import { toTenantScopedPath } from '@web/utils/to-tenant-scoped-path';

export type TBuildPostPublishPathsInput = {
  tenantId: string;
  locales: readonly string[];
  postSlug: string;
  tagSlugs: string[];
  topicSlug: string | undefined;
  blogIndexPageParams: { page: string }[];
  tagPaginationParams: { slug: string; page: string }[];
  topicPaginationParams: { slug: string; page: string }[];
};

/**
 * Every tenant-scoped, resolved path a published `blog_post` can affect:
 * its own detail page, the home and blog archive (with pagination), and
 * every tag/topic detail page it belongs to (with their own pagination).
 * `tagPaginationParams`/`topicPaginationParams` cover every tag/topic page
 * in the tenant — filtered here down to the ones this post actually
 * belongs to.
 */
export const buildPostPublishPaths = (
  input: TBuildPostPublishPathsInput,
): string[] => {
  const {
    tenantId,
    locales,
    postSlug,
    tagSlugs,
    topicSlug,
    blogIndexPageParams,
    tagPaginationParams,
    topicPaginationParams,
  } = input;

  const affectedTagPages = tagPaginationParams.filter((tagPage) =>
    tagSlugs.includes(tagPage.slug),
  );
  const affectedTopicPages = topicSlug
    ? topicPaginationParams.filter((topicPage) => topicPage.slug === topicSlug)
    : [];

  const unprefixedPaths = [
    routes.home(),
    routes.blogIndex(),
    ...blogIndexPageParams.map((params) =>
      routes.blogIndex(Number(params.page)),
    ),
    routes.post(postSlug),
    ...tagSlugs.map((slug) => routes.tag(slug)),
    ...affectedTagPages.map((tagPage) =>
      routes.tag(tagPage.slug, Number(tagPage.page)),
    ),
    ...(topicSlug ? [routes.topic(topicSlug)] : []),
    ...affectedTopicPages.map((topicPage) =>
      routes.topic(topicPage.slug, Number(topicPage.page)),
    ),
  ];

  const scopedPaths = locales.flatMap((locale) =>
    unprefixedPaths.map((path) => toTenantScopedPath(tenantId, locale, path)),
  );

  return Array.from(new Set(scopedPaths));
};
