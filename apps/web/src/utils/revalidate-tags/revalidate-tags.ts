import type { AllSanitySchemaTypes, TModuleType } from '@blog/config';

type TSanityType = Extract<AllSanitySchemaTypes, { _type: string }>['_type'];

/** Every non-module document `_type` that a `@blog/service` loader's `isr(...)` tags depend on. */
type TCachedDocumentType =
  | 'page_tag'
  | 'page_topic'
  | 'page_tagIndex'
  | 'page_topicIndex'
  | 'page_postIndex'
  | 'page_landing'
  | 'page_post'
  | 'page_home'
  | 'page_privacyIndex'
  | 'page_privacyDocument'
  | 'page_legalIndex'
  | 'page_legalDocument'
  | 'page_cookieStatement'
  | 'template_home'
  | 'template_landing'
  | 'template_postIndex'
  | 'template_privacyIndex'
  | 'template_legalIndex'
  | 'template_topicIndex'
  | 'template_tagIndex'
  | 'template_topic'
  | 'template_tag'
  | 'person'
  | 'blog_topic'
  | 'blog_tag'
  | 'settings_site'
  | 'settings_navigation'
  | 'settings_footer'
  | 'link'
  | 'redirect'
  | 'translation.metadata'
  | 'block_feature'
  | 'block_testimonial'
  | 'block_faq';

/** Base ISR tags the revalidation webhook purges, per Sanity document `_type`. */
const REVALIDATE_TAGS = {
  person: ['author', 'posts', 'modules:team'],
  blog_topic: ['topic', 'topics', 'posts'],
  blog_tag: ['tag', 'tags', 'posts'],
  settings_site: ['site-settings'],
  settings_navigation: ['navigation'],
  settings_footer: ['footer'],
  page_home: ['homePage'],
  page_postIndex: ['page_postIndex'],
  page_landing: ['page_landing'],
  template_home: ['homePage', 'template_home'],
  template_landing: ['page_landing', 'template_landing'],
  template_postIndex: ['page_postIndex', 'template_postIndex'],
  template_privacyIndex: ['page_privacyIndex', 'template_privacyIndex'],
  template_legalIndex: ['page_legalIndex', 'template_legalIndex'],
  template_topicIndex: ['page_topicIndex', 'template_topicIndex'],
  template_tagIndex: ['page_tagIndex', 'template_tagIndex'],
  template_topic: ['page_topic', 'template_topic'],
  template_tag: ['page_tag', 'template_tag'],
  page_post: ['page_post', 'posts', 'author', 'topic', 'tag'],
  page_tag: ['page_tag'],
  page_topic: ['page_topic'],
  page_topicIndex: ['page_topicIndex'],
  page_tagIndex: ['page_tagIndex'],
  page_privacyIndex: ['page_privacyIndex'],
  page_privacyDocument: ['page_privacyDocument'],
  page_legalIndex: ['page_legalIndex'],
  page_legalDocument: ['page_legalDocument'],
  page_cookieStatement: ['page_cookieStatement'],
  module_heroBlog: ['modules:heroBlog'],
  module_heroProfile: ['modules:heroProfile'],
  module_heroStatement: ['modules:heroStatement'],
  module_postList: ['modules:postList'],
  module_taxonomyList: ['modules:taxonomyList'],
  module_postLatest: ['modules:postLatest'],
  module_postFeatured: ['modules:postFeatured'],
  module_postRelated: ['modules:postRelated'],
  module_featureList: ['modules:featureList'],
  module_featureHighlights: ['modules:featureHighlights'],
  module_testimonial: ['modules:testimonial'],
  module_faq: ['modules:faq'],
  module_logoWall: ['modules:logoWall'],
  module_stats: ['modules:stats'],
  module_content: ['modules:content'],
  module_cta: ['modules:cta'],
  module_newsletter: ['modules:newsletter'],
  module_contactForm: ['modules:contactForm'],
  module_cookieSettings: ['modules:cookieSettings'],
  module_team: ['modules:team'],
  module_timeline: ['modules:timeline'],
  module_pricing: ['modules:pricing'],
  module_sectionPages: ['modules:sectionPages'],
  module_embed: ['modules:embed'],
  link: ['link'],
  redirect: ['redirect'],
  'translation.metadata': ['translation.metadata'],
  block_feature: ['block_feature'],
  block_testimonial: ['block_testimonial'],
  block_faq: ['block_faq'],
} as const satisfies Record<
  TModuleType | TCachedDocumentType,
  readonly string[]
> &
  Partial<Record<TSanityType, readonly string[]>>;

export const getRevalidateTagsForType = (
  type: string,
  id: string,
): string[] => {
  // `type` comes from the webhook body, so never read an `Object.prototype` key.
  if (!Object.hasOwn(REVALIDATE_TAGS, type)) return [];

  const tags: string[] = [
    ...REVALIDATE_TAGS[type as keyof typeof REVALIDATE_TAGS],
  ];
  if (type.startsWith('module_')) tags.push(`module:${id}`);
  return tags;
};
