import type {
  Module_cta,
  Module_heroBlog,
  Module_postLatest,
  Module_postList,
  Module_taxonomyList,
} from '@blog/config/sanity/generated/types';

import {
  BRAND_VARIANT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  CTA_VARIANT,
  HERO_VARIANT,
  POST_SOURCE,
  TAXONOMY_KIND,
  TAXONOMY_SORT,
  type TLocaleIsoCode,
} from '@blog/config/constants';

import type { TStarterCopy } from './copy/starter-copy';
import type { TStarterDocumentUnion, TStarterModule } from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import {
  localizedString,
  moduleHeadingBlock,
  reference,
} from './starter-fields';

const LATEST_POSTS_LIMIT = 6;
const POST_LIST_PAGE_SIZE = 12;

export function buildBlogModules(
  locale: TLocaleIsoCode,
  { blog }: TStarterCopy,
): TStarterDocumentUnion[] {
  return [
    {
      _id: STARTER_DOCUMENT_IDS.BLOG_HERO,
      _type: 'module_heroBlog',
      title: 'Blog Hero',
      brandVariant: BRAND_VARIANT.PRIMARY,
      variant: HERO_VARIANT.STACKED,
      postSource: POST_SOURCE.PINNED,
      post: reference(STARTER_DOCUMENT_IDS.BLOG_WELCOME_POST),
      eyebrow: localizedString(locale, blog.hero.eyebrow),
      primaryActionLabel: localizedString(locale, blog.hero.primaryActionLabel),
      primaryActionAppearance: CTA_ACTION_APPEARANCE.CONTAINED,
    } satisfies TStarterModule<Module_heroBlog>,
    {
      _id: STARTER_DOCUMENT_IDS.BLOG_LATEST_POSTS,
      _type: 'module_postLatest',
      title: 'Latest Posts',
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: moduleHeadingBlock(locale, blog.latestPosts.heading),
      limit: LATEST_POSTS_LIMIT,
    } satisfies TStarterModule<Module_postLatest>,
    {
      _id: STARTER_DOCUMENT_IDS.BLOG_TOPIC_LIST,
      _type: 'module_taxonomyList',
      title: 'Home Topic List',
      brandVariant: BRAND_VARIANT.SECONDARY,
      headingBlock: moduleHeadingBlock(locale, blog.topics.heading),
      taxonomy: TAXONOMY_KIND.TOPICS,
      sortOrder: TAXONOMY_SORT.MOST_POSTS,
    } satisfies TStarterModule<Module_taxonomyList>,
    {
      _id: STARTER_DOCUMENT_IDS.BLOG_CTA,
      _type: 'module_cta',
      title: 'About the Author',
      brandVariant: BRAND_VARIANT.SECONDARY,
      bandTone: BRAND_VARIANT.PRIMARY,
      variant: CTA_VARIANT.CALLOUT,
      headingBlock: moduleHeadingBlock(
        locale,
        blog.cta.heading,
        blog.cta.supportingText,
      ),
      ctaButtons: [
        {
          _key: STARTER_DOCUMENT_IDS.BLOG_ABOUT_LINK,
          _type: 'ctaButton',
          variant: CTA_ACTION_VARIANT.PRIMARY,
          appearance: CTA_ACTION_APPEARANCE.CONTAINED,
          link: reference(STARTER_DOCUMENT_IDS.BLOG_ABOUT_LINK),
        },
      ],
    } satisfies TStarterModule<Module_cta>,
    {
      _id: STARTER_DOCUMENT_IDS.BLOG_POST_LIST,
      _type: 'module_postList',
      title: 'Blog Post List',
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: moduleHeadingBlock(locale, blog.postList.heading),
      pageSize: POST_LIST_PAGE_SIZE,
    } satisfies TStarterModule<Module_postList>,
  ];
}
