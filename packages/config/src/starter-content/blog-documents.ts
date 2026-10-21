import type {
  Blog_topic,
  Link,
  Person,
} from '@blog/config/sanity/generated/types';

import {
  LINK_TYPE,
  PORTABLE_TEXT_BLOCK_TYPE,
  type TLocaleIsoCode,
} from '@blog/config/constants';

import { buildBaseDocuments } from './base-documents';
import { buildBlogIndexPages } from './blog-index-pages';
import { buildBlogModules } from './blog-modules';
import { buildBlogPages } from './blog-pages';
import type { TStarterCopy } from './copy/starter-copy';
import type {
  TStarterDocument,
  TStarterDocumentUnion,
  TStarterPost,
} from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import {
  keyedReference,
  localizedString,
  localizedText,
  pageHeadingBlock,
  paragraphs,
  reference,
  seo,
  slug,
} from './starter-fields';

const ids = STARTER_DOCUMENT_IDS;

function internalLink(
  id: string,
  title: string,
  locale: TLocaleIsoCode,
  targetId: string,
): TStarterDocument<Link, 'title' | 'label' | 'linkType'> {
  return {
    _id: id,
    _type: 'link',
    title,
    label: localizedString(locale, title),
    linkType: LINK_TYPE.INTERNAL,
    internalReference: reference(targetId),
  };
}

export function buildBlogDocuments({
  siteName,
  locale,
  publishedAt,
  copy,
}: {
  siteName: string;
  locale: TLocaleIsoCode;
  publishedAt: string;
  copy: TStarterCopy;
}): TStarterDocumentUnion[] {
  const { topic, welcomePost, about } = copy.blog;

  return [
    ...buildBaseDocuments({
      siteName,
      locale,
      copy,
      navigationItems: [ids.BLOG_POST_INDEX_LINK, ids.BLOG_ABOUT_LINK].map(
        (linkId) => ({
          _key: linkId,
          _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
          link: reference(linkId),
        }),
      ),
      homeLayout: {
        hero: reference(ids.BLOG_HERO),
        modules: [ids.BLOG_LATEST_POSTS, ids.BLOG_TOPIC_LIST, ids.BLOG_CTA].map(
          keyedReference,
        ),
      },
      postIndexModules: [keyedReference(ids.BLOG_POST_LIST)],
    }),
    ...buildBlogModules(locale, copy),
    ...buildBlogIndexPages(locale, copy),
    ...buildBlogPages(locale, copy),
    {
      _id: ids.BLOG_TOPIC,
      _type: 'blog_topic',
      title: localizedString(locale, topic.title),
      description: localizedText(locale, topic.description),
    } satisfies TStarterDocument<Blog_topic, 'title'>,
    {
      _id: ids.BLOG_AUTHOR,
      _type: 'person',
      name: siteName,
    } satisfies TStarterDocument<Person, 'name'>,
    {
      _id: ids.BLOG_WELCOME_POST,
      _type: 'page_post',
      language: locale,
      title: welcomePost.title,
      slug: slug(welcomePost.slug),
      headingBlock: pageHeadingBlock(
        welcomePost.title,
        welcomePost.supportingText,
      ),
      content: paragraphs(welcomePost.body),
      featured: true,
      author: reference(ids.BLOG_AUTHOR),
      topic: reference(ids.BLOG_TOPIC),
      publishedAt,
      seo: seo(welcomePost.metaTitle, welcomePost.metaDescription),
    } satisfies TStarterPost,
    internalLink(
      ids.BLOG_POST_INDEX_LINK,
      copy.postIndex.title,
      locale,
      ids.POST_INDEX,
    ),
    internalLink(ids.BLOG_ABOUT_LINK, about.title, locale, ids.BLOG_ABOUT),
  ];
}
