import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type {
  Page_landing,
  Page_topic,
  Template_landing,
  Template_topic,
} from '@shinefold/config/sanity/generated/types';

import type { TStarterCopy } from './copy/starter-copy';
import type { TStarterDocumentUnion, TStarterPage } from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import type { TStarterTemplate } from './starter-document-shape';
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
    } satisfies TStarterTemplate<Template_topic>,
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
    } satisfies TStarterTemplate<Template_landing>,
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
