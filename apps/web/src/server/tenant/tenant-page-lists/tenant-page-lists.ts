import type { TLocaleIsoCode } from '@blog/config';
import { service, type TTenantSanityContext } from '@blog/service';
import type { TResult } from '@blog/utils';
import type { TTranslatedPage } from '@web/utils/to-translated-sitemap-entry';

type TPaginatedPageParam = TTranslatedPage & { page: string };

export type TTenantPageLists = {
  posts: (TTranslatedPage & { publishedAt: string })[];
  topics: TTranslatedPage[];
  tags: TTranslatedPage[];
  topicPages: TPaginatedPageParam[];
  tagPages: TPaginatedPageParam[];
  blogPages: { page: string }[];
  landingPages: TTranslatedPage[];
  privacyDocuments: TTranslatedPage[];
  legalDocuments: TTranslatedPage[];
};

export type TTenantPageListResults = {
  [TKey in keyof TTenantPageLists]: TResult<TTenantPageLists[TKey]>;
};

export const getTenantPageListResults = async (
  tenant: TTenantSanityContext,
  locales: TLocaleIsoCode[],
): Promise<TTenantPageListResults> => {
  const [
    posts,
    topics,
    tags,
    topicPages,
    tagPages,
    blogPages,
    landingPages,
    privacyDocuments,
    legalDocuments,
  ] = await Promise.all([
    service.pages.post.v1.getPostParams(tenant, locales),
    service.pages.topic.v1.getTopicParams(tenant, locales),
    service.pages.tag.v1.getTagParams(tenant, locales),
    service.pages.topic.v1.getTopicPaginationParams(tenant, locales),
    service.pages.tag.v1.getTagPaginationParams(tenant, locales),
    service.pages.blog.v1.getIndexPageParams(tenant),
    service.pages.landing.v1.getPageSlugs(tenant, locales),
    service.pages.sectionDocument.v1.getSectionDocumentParams(
      'page_privacyDocument',
      tenant,
      locales,
    ),
    service.pages.sectionDocument.v1.getSectionDocumentParams(
      'page_legalDocument',
      tenant,
      locales,
    ),
  ]);

  return {
    posts,
    topics,
    tags,
    topicPages,
    tagPages,
    blogPages,
    landingPages,
    privacyDocuments,
    legalDocuments,
  };
};
