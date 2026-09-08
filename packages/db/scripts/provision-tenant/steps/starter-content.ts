import {
  BRAND_VARIANT,
  HERO_IMAGE_SOURCE,
  POST_SOURCE,
  HERO_VARIANT,
  PRESET_ID,
  LINK_TYPE,
} from '@blog/config/constants';
import type { TTenant } from '@blog/db/schema/tenants';

// Fixed document ids (published, not `drafts.`-prefixed) — every field
// each seeded document type requires per its schema in
// `packages/studio/src/schema-types`, so the seeded dataset validates
// against the real schema rather than an invented shape. No generated
// `@blog/config` types exist for a not-yet-created project's dataset, so
// these stay loosely typed (`TSanityDocument`), not `any`.
export const STARTER_DOCUMENT_IDS = {
  AUTHOR: 'provisioning.author.starter',
  TOPIC: 'provisioning.topic.starter',
  POST: 'provisioning.post.starter',
  NAVIGATION: 'provisioning.settings.navigation',
  FOOTER: 'provisioning.settings.footer',
  THEME: 'provisioning.settings.theme',
  NEWSLETTER: 'provisioning.settings.newsletter',
  SITE: 'provisioning.settings.site',
  HERO_BLOG: 'provisioning.module.hero-blog',
  HOME: 'provisioning.settings.home',
} as const;

export type TSanityDocument = Record<string, unknown> & {
  _id: string;
  _type: string;
};

export function buildStarterDocuments(
  tenant: Pick<TTenant, 'name'>,
): TSanityDocument[] {
  const now = new Date().toISOString();

  const author: TSanityDocument = {
    _id: STARTER_DOCUMENT_IDS.AUTHOR,
    _type: 'blog_author',
    name: `${tenant.name} Team`,
  };

  const topic: TSanityDocument = {
    _id: STARTER_DOCUMENT_IDS.TOPIC,
    _type: 'blog_topic',
    title: 'Announcements',
    slug: { _type: 'slug', current: 'announcements' },
  };

  const post: TSanityDocument = {
    _id: STARTER_DOCUMENT_IDS.POST,
    _type: 'blog_post',
    title: `Welcome to ${tenant.name}`,
    slug: { _type: 'slug', current: 'welcome' },
    excerpt:
      `This is the first post on ${tenant.name}. Edit or delete it from ` +
      'the Studio once you are ready to publish real content here.',
    author: { _type: 'reference', _ref: STARTER_DOCUMENT_IDS.AUTHOR },
    topic: { _type: 'reference', _ref: STARTER_DOCUMENT_IDS.TOPIC },
    publishedAt: now,
    body: [
      {
        _type: 'block',
        _key: 'starter-block',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'starter-span',
            marks: [],
            text: `Welcome to ${tenant.name}. This starter post was created automatically during provisioning — replace it with your own.`,
          },
        ],
      },
    ],
  };

  const navigation: TSanityDocument = {
    _id: STARTER_DOCUMENT_IDS.NAVIGATION,
    _type: 'settings_navigation',
    title: 'Primary Navigation',
    items: [
      {
        _type: 'link',
        _key: 'starter-nav-blog',
        label: 'Blog',
        linkType: LINK_TYPE.EXTERNAL,
        url: '/blog',
        openInNewTab: false,
      },
    ],
  };

  const footer: TSanityDocument = {
    _id: STARTER_DOCUMENT_IDS.FOOTER,
    _type: 'settings_footer',
    title: 'Footer',
  };

  const theme: TSanityDocument = {
    _id: STARTER_DOCUMENT_IDS.THEME,
    _type: 'settings_theme',
    title: 'Theme',
    preset: PRESET_ID.CONSOLE,
  };

  const newsletter: TSanityDocument = {
    _id: STARTER_DOCUMENT_IDS.NEWSLETTER,
    _type: 'settings_newsletter',
    title: 'Newsletter',
    heading: 'Subscribe for updates',
    trustCues: ['No spam', 'Unsubscribe anytime'],
  };

  const site: TSanityDocument = {
    _id: STARTER_DOCUMENT_IDS.SITE,
    _type: 'settings_site',
    title: 'Site Settings',
    brand: {
      _type: 'brand',
      name: tenant.name,
    },
    description:
      `${tenant.name} was just provisioned on the platform. Edit this ` +
      'default description in Site Settings once you have real copy.',
  };

  const heroBlog: TSanityDocument = {
    _id: STARTER_DOCUMENT_IDS.HERO_BLOG,
    _type: 'module_heroBlog',
    title: 'Welcome Hero',
    brandVariant: BRAND_VARIANT.PRIMARY,
    postSource: POST_SOURCE.PINNED,
    post: { _type: 'reference', _ref: STARTER_DOCUMENT_IDS.POST },
    imageSource: HERO_IMAGE_SOURCE.POST,
    variant: HERO_VARIANT.SPLIT,
  };

  const home: TSanityDocument = {
    _id: STARTER_DOCUMENT_IDS.HOME,
    _type: 'page_home',
    title: 'Home',
    hero: { _type: 'reference', _ref: STARTER_DOCUMENT_IDS.HERO_BLOG },
  };

  return [
    author,
    topic,
    post,
    navigation,
    footer,
    theme,
    newsletter,
    site,
    heroBlog,
    home,
  ];
}
