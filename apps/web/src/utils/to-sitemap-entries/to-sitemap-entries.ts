import { routes, type TLocaleIsoCode } from '@blog/config';
import type { TTenantPageLists } from '@web/server/tenant/tenant-page-lists/tenant-page-lists';
import { toLanguagePageEntries } from '@web/utils/to-language-page-entries';
import { toPaginatedPageEntry } from '@web/utils/to-paginated-page-entry';
import { toSitemapEntry } from '@web/utils/to-sitemap-entry';
import {
  toTranslatedSitemapEntry,
  type TTranslatedPage,
  type TTranslatedSitemapContext,
} from '@web/utils/to-translated-sitemap-entry';
import type { MetadataRoute } from 'next';

type TPaginatedPage = TTenantPageLists['topicPages'][number];

type TSitemapEntriesParams = TTranslatedSitemapContext & {
  lists: TTenantPageLists;
};

export const toSitemapEntries = ({
  lists,
  ...context
}: TSitemapEntriesParams): MetadataRoute.Sitemap => {
  const { posts, topics, tags, topicPages, tagPages, blogPages } = lists;
  const { landingPages, privacyDocuments, legalDocuments } = lists;
  const { translationMap, liveLocales, defaultLocale, siteUrl } = context;

  const indexPages: [string, readonly TLocaleIsoCode[]][] = [
    [routes.home(), [defaultLocale, ...translationMap.homeLanguages]],
    [routes.blogIndex(), translationMap.postIndexLanguages],
    [routes.topics(), translationMap.topicIndexLanguages],
    [routes.tags(), translationMap.tagIndexLanguages],
    [routes.privacy(), translationMap.privacyIndexLanguages],
    [routes.legal(), translationMap.legalIndexLanguages],
    [routes.cookieStatement(), translationMap.cookieStatementLanguages],
  ];
  const toTranslatedEntries = (
    pages: TTranslatedPage[],
    documentType: string,
    toHref: (slug: string) => string,
  ) =>
    pages.map((page) =>
      toTranslatedSitemapEntry({ page, documentType, toHref, ...context }),
    );
  const toPaginatedEntries = (
    pages: TPaginatedPage[],
    toHref: (slug: string, page: number) => string,
  ) =>
    pages.map(({ slug, language, page }) =>
      toPaginatedPageEntry(
        toHref(slug, Number(page)),
        language,
        defaultLocale,
        siteUrl,
      ),
    );

  return [
    ...indexPages.flatMap(([href, languages]) =>
      toLanguagePageEntries({
        href,
        languages,
        liveLocales,
        defaultLocale,
        siteUrl,
      }),
    ),
    ...blogPages.map(({ page }) =>
      toSitemapEntry(routes.blogIndex(Number(page)), siteUrl),
    ),
    ...posts.map(({ publishedAt, ...page }) =>
      toTranslatedSitemapEntry({
        page,
        documentType: 'page_post',
        toHref: routes.post,
        lastModified: publishedAt,
        ...context,
      }),
    ),
    ...toTranslatedEntries(topics, 'page_topic', routes.topic),
    ...toPaginatedEntries(topicPages, routes.topic),
    ...toTranslatedEntries(tags, 'page_tag', routes.tag),
    ...toPaginatedEntries(tagPages, routes.tag),
    ...toTranslatedEntries(landingPages, 'page_landing', routes.landingPage),
    ...toTranslatedEntries(
      privacyDocuments,
      'page_privacyDocument',
      routes.privacyDocument,
    ),
    ...toTranslatedEntries(
      legalDocuments,
      'page_legalDocument',
      routes.legalDocument,
    ),
  ];
};
