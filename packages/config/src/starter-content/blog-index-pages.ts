import {
  BRAND_VARIANT,
  TAXONOMY_KIND,
  type TLocaleIsoCode,
  type TTaxonomyKind,
} from '@shinefold/config/constants';
import type {
  Module_taxonomyList,
  Page_tagIndex,
  Page_topicIndex,
  Template_tagIndex,
  Template_topicIndex,
} from '@shinefold/config/sanity/generated/types';

import type { TStarterCopy } from './copy/starter-copy';
import type {
  TStarterDocumentUnion,
  TStarterModule,
  TStarterPage,
} from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import type { TStarterTemplate } from './starter-document-shape';
import { moduleHeadingBlock, reference } from './starter-fields';
import { pageFields, starterTemplate } from './starter-pages';

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

// The Studio opens these singletons by an id equal to their type, as the migrations that seed them do.
function singleton<TDocument extends { _type: string }>(document: TDocument) {
  return { _id: document._type, ...document };
}

function indexPage(
  locale: TLocaleIsoCode,
  copy: TIndexCopy,
  templateId: string,
  listId: string,
) {
  return {
    ...pageFields(locale, templateId, copy),
    taxonomyList: reference(listId),
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
    starterTemplate(
      ids.BLOG_TOPIC_INDEX_TEMPLATE,
      'template_topicIndex',
      'Topic Index Template',
    ) satisfies TStarterTemplate<Template_topicIndex>,
    singleton({
      _type: 'page_topicIndex',
      ...indexPage(
        locale,
        topicIndex,
        ids.BLOG_TOPIC_INDEX_TEMPLATE,
        ids.TOPIC_INDEX_LIST,
      ),
    }) satisfies TStarterPage<Page_topicIndex>,
    indexTaxonomyList(
      ids.TAG_INDEX_LIST,
      'Tag Index List',
      TAXONOMY_KIND.TAGS,
      moduleHeadingBlock(locale, tagIndex.listHeading),
    ),
    starterTemplate(
      ids.BLOG_TAG_INDEX_TEMPLATE,
      'template_tagIndex',
      'Tag Index Template',
    ) satisfies TStarterTemplate<Template_tagIndex>,
    singleton({
      _type: 'page_tagIndex',
      ...indexPage(
        locale,
        tagIndex,
        ids.BLOG_TAG_INDEX_TEMPLATE,
        ids.TAG_INDEX_LIST,
      ),
    }) satisfies TStarterPage<Page_tagIndex>,
  ];
}
