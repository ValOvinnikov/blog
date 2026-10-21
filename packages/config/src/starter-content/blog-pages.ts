import type {
  Page_landing,
  Page_topic,
  Template_landing,
  Template_topic,
} from '@blog/config/sanity/generated/types';

import type { TLocaleIsoCode } from '@blog/config/constants';

import type { TStarterCopy } from './copy/starter-copy';
import type {
  TStarterDocument,
  TStarterDocumentUnion,
  TStarterPage,
} from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import { pageHeadingBlock, reference, seo, slug } from './starter-fields';

const ids = STARTER_DOCUMENT_IDS;

export function buildBlogPages(
  locale: TLocaleIsoCode,
  { blog: { topic, about } }: TStarterCopy,
): TStarterDocumentUnion[] {
  return [
    {
      _id: ids.BLOG_TOPIC_TEMPLATE,
      _type: 'template_topic',
      title: 'Topic Template',
    } satisfies TStarterDocument<Template_topic, 'title'>,
    {
      _id: ids.BLOG_TOPIC_PAGE,
      _type: 'page_topic',
      language: locale,
      title: topic.title,
      slug: slug(topic.slug),
      topic: reference(ids.BLOG_TOPIC),
      headingBlock: pageHeadingBlock(topic.title, topic.description),
      template: reference(ids.BLOG_TOPIC_TEMPLATE),
      seo: seo(topic.metaTitle, topic.description),
    } satisfies TStarterPage<Page_topic>,
    {
      _id: ids.BLOG_ABOUT_TEMPLATE,
      _type: 'template_landing',
      title: 'About Template',
    } satisfies TStarterDocument<Template_landing, 'title'>,
    {
      _id: ids.BLOG_ABOUT,
      _type: 'page_landing',
      language: locale,
      title: about.title,
      slug: slug(about.slug),
      headingBlock: pageHeadingBlock(about.heading, about.supportingText),
      template: reference(ids.BLOG_ABOUT_TEMPLATE),
      seo: seo(about.metaTitle, about.metaDescription),
    } satisfies TStarterPage<Page_landing>,
  ];
}
