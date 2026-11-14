import { NEWSLETTER_RESULT, routes } from '@blog/config';
import type { TTenantPageLists } from '@web/server/tenant/tenant-page-lists/tenant-page-lists';
import {
  buildNextBlogIndexPage,
  buildNextPagePaths,
  type TLocalizedPath,
} from '@web/utils/build-next-page-paths';
import { toTenantScopedPath } from '@web/utils/to-tenant-scoped-path';

export type TBuildTenantSitePathsInput = {
  tenantId: string;
  locales: readonly string[];
  lists: TTenantPageLists;
  documentHref?: string;
};

const toLocalizedPaths = (
  pages: TTenantPageLists['topics'],
  toPath: (slug: string) => string,
): TLocalizedPath[] =>
  pages.map(({ slug, language }) => ({ language, path: toPath(slug) }));

const toLocalizedPagePaths = (
  pages: TTenantPageLists['topicPages'],
  toPath: (slug: string, page: number) => string,
): TLocalizedPath[] =>
  pages.map(({ slug, language, page }) => ({
    language,
    path: toPath(slug, Number(page)),
  }));

export const buildTenantSitePaths = ({
  tenantId,
  locales,
  lists,
  documentHref,
}: TBuildTenantSitePathsInput): string[] => {
  const { posts, topics, tags, topicPages, tagPages, blogPages } = lists;
  const { landingPages, privacyDocuments, legalDocuments } = lists;

  const everyLanguagePaths = [
    routes.home(),
    routes.blogIndex(),
    ...blogPages.map(({ page }) => routes.blogIndex(Number(page))),
    routes.blogIndex(buildNextBlogIndexPage(blogPages)),
    routes.topics(),
    routes.tags(),
    routes.privacy(),
    routes.legal(),
    routes.cookieStatement(),
    routes.newsletterUnsubscribeConfirmation(),
    ...Object.values(NEWSLETTER_RESULT).map(routes.newsletterResult),
    ...(documentHref ? [documentHref] : []),
  ];
  const localizedPaths = [
    ...toLocalizedPaths(posts, routes.post),
    ...toLocalizedPaths(topics, routes.topic),
    ...toLocalizedPagePaths(topicPages, routes.topic),
    ...buildNextPagePaths(topics, topicPages, routes.topic),
    ...toLocalizedPaths(tags, routes.tag),
    ...toLocalizedPagePaths(tagPages, routes.tag),
    ...buildNextPagePaths(tags, tagPages, routes.tag),
    ...toLocalizedPaths(landingPages, routes.landingPage),
    ...toLocalizedPaths(privacyDocuments, routes.privacyDocument),
    ...toLocalizedPaths(legalDocuments, routes.legalDocument),
  ];

  const scopedPaths = [
    ...locales.flatMap((locale) =>
      everyLanguagePaths.map((path) =>
        toTenantScopedPath(tenantId, locale, path),
      ),
    ),
    ...localizedPaths.map(({ language, path }) =>
      toTenantScopedPath(tenantId, language, path),
    ),
  ];

  return Array.from(new Set(scopedPaths));
};
