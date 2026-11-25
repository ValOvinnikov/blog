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
import { reference, slug } from './starter-fields';
import { pageFields, starterTemplate } from './starter-pages';

const ids = STARTER_DOCUMENT_IDS;

export function buildBlogPages(
  locale: TLocaleIsoCode,
  { blog: { topic, about } }: TStarterCopy,
): TStarterDocumentUnion[] {
  return [
    starterTemplate(
      ids.BLOG_TOPIC_TEMPLATE,
      'template_topic',
      'Topic Template',
    ) satisfies TStarterTemplate<Template_topic>,
    {
      _id: ids.BLOG_TOPIC_PAGE,
      _type: 'page_topic',
      ...pageFields(locale, ids.BLOG_TOPIC_TEMPLATE, {
        ...topic,
        heading: topic.title,
        supportingText: topic.description,
        metaDescription: topic.description,
      }),
      slug: slug(topic.slug),
      topic: reference(ids.BLOG_TOPIC),
    } satisfies TStarterPage<Page_topic>,
    starterTemplate(
      ids.BLOG_ABOUT_TEMPLATE,
      'template_landing',
      'About Template',
    ) satisfies TStarterTemplate<Template_landing>,
    {
      _id: ids.BLOG_ABOUT,
      _type: 'page_landing',
      ...pageFields(locale, ids.BLOG_ABOUT_TEMPLATE, about),
      slug: slug(about.slug),
    } satisfies TStarterPage<Page_landing>,
  ];
}
