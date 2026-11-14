import type { TTenantPageLists } from '@web/server/tenant/tenant-page-lists/tenant-page-lists';

type TTranslatedPage = TTenantPageLists['topics'][number];
type TPaginatedPage = TTenantPageLists['topicPages'][number];
export type TLocalizedPath = { language: string; path: string };

const toLastPage = (pages: { page: string }[]): number =>
  Math.max(1, ...pages.map(({ page }) => Number(page)));

/** The page after each listing's current last, which a removed entry can leave cached with stale content. */
export const buildNextPagePaths = (
  pages: TTranslatedPage[],
  paginatedPages: TPaginatedPage[],
  toPath: (slug: string, page: number) => string,
): TLocalizedPath[] =>
  pages.map(({ slug, language }) => {
    const ownPages = paginatedPages.filter(
      (page) => page.slug === slug && page.language === language,
    );
    return { language, path: toPath(slug, toLastPage(ownPages) + 1) };
  });

export const buildNextBlogIndexPage = (
  blogPages: TTenantPageLists['blogPages'],
): number => toLastPage(blogPages) + 1;
