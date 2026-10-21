import type {
  Module_taxonomyList,
  Page_tagIndex,
  Page_topicIndex,
  Template_tagIndex,
  Template_topicIndex,
} from '@blog/config/sanity/generated/types';

import {
  BRAND_VARIANT,
  TAXONOMY_KIND,
  type TLocaleIsoCode,
  type TTaxonomyKind,
} from '@blog/config/constants';

import type { TStarterCopy } from './copy/starter-copy';
import type {
  TStarterDocument,
  TStarterDocumentUnion,
  TStarterModule,
  TStarterPage,
} from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import {
  moduleHeadingBlock,
  pageHeadingBlock,
  reference,
  seo,
} from './starter-fields';

type TIndexCopy = TStarterCopy['blog']['topicIndex'];

const ids = STARTER_DOCUMENT_IDS;

function indexTaxonomyList(
  id: string,
  title: string,
  taxonomy: TTaxonomyKind,
  headingBlock: ReturnType<typeof moduleHeadingBlock>,
): TStarterModule<Module_taxonomyList> {
  return {
    _id: id,
    _type: 'module_taxonomyList',
    title,
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock,
    taxonomy,
  };
}

function indexPage(
  locale: TLocaleIsoCode,
  copy: TIndexCopy,
  templateId: string,
  listId: string,
) {
  return {
    language: locale,
    title: copy.title,
    headingBlock: pageHeadingBlock(copy.heading, copy.supportingText),
    template: reference(templateId),
    taxonomyList: reference(listId),
    seo: seo(copy.metaTitle, copy.metaDescription),
  };
}

export function buildBlogIndexPages(
  locale: TLocaleIsoCode,
  { blog: { topicIndex, tagIndex } }: TStarterCopy,
): TStarterDocumentUnion[] {
  return [
    indexTaxonomyList(
      ids.TOPIC_INDEX_LIST,
      'Topic Index List',
      TAXONOMY_KIND.TOPICS,
      moduleHeadingBlock(locale, topicIndex.listHeading),
    ),
    {
      _id: ids.BLOG_TOPIC_INDEX_TEMPLATE,
      _type: 'template_topicIndex',
      title: 'Topic Index Template',
    } satisfies TStarterDocument<Template_topicIndex, 'title'>,
    {
      _id: ids.TOPIC_INDEX,
      _type: 'page_topicIndex',
      ...indexPage(
        locale,
        topicIndex,
        ids.BLOG_TOPIC_INDEX_TEMPLATE,
        ids.TOPIC_INDEX_LIST,
      ),
    } satisfies TStarterPage<Page_topicIndex>,
    indexTaxonomyList(
      ids.TAG_INDEX_LIST,
      'Tag Index List',
      TAXONOMY_KIND.TAGS,
      moduleHeadingBlock(locale, tagIndex.listHeading),
    ),
    {
      _id: ids.BLOG_TAG_INDEX_TEMPLATE,
      _type: 'template_tagIndex',
      title: 'Tag Index Template',
    } satisfies TStarterDocument<Template_tagIndex, 'title'>,
    {
      _id: ids.TAG_INDEX,
      _type: 'page_tagIndex',
      ...indexPage(
        locale,
        tagIndex,
        ids.BLOG_TAG_INDEX_TEMPLATE,
        ids.TAG_INDEX_LIST,
      ),
    } satisfies TStarterPage<Page_tagIndex>,
  ];
}
