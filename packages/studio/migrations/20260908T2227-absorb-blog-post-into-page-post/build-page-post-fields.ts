import { rewriteRefsDeep } from './rewrite-refs';
import { SHARED_MODULE_IDS } from './shared-modules';

export type TBlogPostDoc = {
  _id: string;
  title?: string;
  slug?: { _type: 'slug'; current?: string };
  excerpt?: string;
  heroImage?: unknown;
  author?: unknown;
  topic?: unknown;
  tags?: unknown;
  publishedAt?: string;
  body?: unknown;
  featured?: boolean;
  newsletterEnabled?: boolean;
  skim?: unknown;
  seo?: unknown;
};

export type TExistingPagePost = {
  title?: string;
  slug?: { _type: 'slug'; current?: string };
  publishedAt?: string;
  seo?: unknown;
};

const buildModules = (newsletterEnabled: boolean | undefined) => [
  {
    _type: 'reference',
    _key: 'postRelated',
    _ref: SHARED_MODULE_IDS.POST_RELATED,
  },
  ...(newsletterEnabled === false
    ? []
    : [
        {
          _type: 'reference',
          _key: 'newsletter',
          _ref: SHARED_MODULE_IDS.NEWSLETTER,
        },
      ]),
];

/**
 * Merges a `blog_post` document onto its `page_post` counterpart: the
 * page's own `title` (its internal label)/`slug`/`publishedAt`/`seo` win
 * when already set, the post's headline and excerpt land in
 * `sectionHeader`, every other content field comes from the post, and
 * `modules` is the two shared modules — omitting the newsletter one when
 * `newsletterEnabled` is explicitly `false`.
 */
export const buildPagePostFields = (
  post: TBlogPostDoc,
  existingPagePost: TExistingPagePost | undefined,
  idMap: ReadonlyMap<string, string>,
): Record<string, unknown> => {
  const copiedFields = rewriteRefsDeep(
    {
      heroImage: post.heroImage,
      author: post.author,
      topic: post.topic,
      tags: post.tags,
      content: post.body,
      featured: post.featured,
      skim: post.skim,
    },
    idMap,
  );

  return {
    ...copiedFields,
    title: existingPagePost?.title ?? post.title,
    sectionHeader: {
      _type: 'requiredHeadingSectionHeader',
      heading: post.title,
      supportingText: post.excerpt,
    },
    slug: existingPagePost?.slug ?? post.slug,
    publishedAt: existingPagePost?.publishedAt ?? post.publishedAt,
    seo: existingPagePost?.seo ?? post.seo,
    modules: buildModules(post.newsletterEnabled),
  };
};
