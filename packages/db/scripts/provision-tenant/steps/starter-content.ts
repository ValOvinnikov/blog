import { BRAND_VARIANTS, PRESET_ID, LINK_TYPE } from '@blog/config/constants';
import type { TTenant } from '@blog/db/schema/tenants';

// Fixed document ids (published, not `drafts.`-prefixed) — every field a
// `blog_post`/`settings_*` singleton/`blog_author`/`blog_topic` document
// requires per `apps/cms/src/schema-types`, so the seeded dataset validates
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
  VOICE: 'provisioning.settings.voice',
  NEWSLETTER: 'provisioning.settings.newsletter',
  SITE: 'provisioning.settings.site',
} as const;

export type TStarterAssetRefs = {
  authorImageAssetId: string;
  ogImageAssetId: string;
};

export type TSanityDocument = Record<string, unknown> & {
  _id: string;
  _type: string;
};

export function buildStarterDocuments(
  tenant: Pick<TTenant, 'name'>,
  assets: TStarterAssetRefs,
): TSanityDocument[] {
  const now = new Date().toISOString();

  const author: TSanityDocument = {
    _id: STARTER_DOCUMENT_IDS.AUTHOR,
    _type: 'blog_author',
    name: `${tenant.name} Team`,
    slug: { _type: 'slug', current: 'editorial-team' },
    image: {
      _type: 'imageWithAlt',
      asset: { _type: 'reference', _ref: assets.authorImageAssetId },
      alt: `${tenant.name} team avatar`,
    },
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

  const voice: TSanityDocument = {
    _id: STARTER_DOCUMENT_IDS.VOICE,
    _type: 'settings_voice',
    title: 'Voice',
  };

  const newsletter: TSanityDocument = {
    _id: STARTER_DOCUMENT_IDS.NEWSLETTER,
    _type: 'settings_newsletter',
    title: 'Newsletter',
    heading: 'Subscribe for updates',
  };

  const site: TSanityDocument = {
    _id: STARTER_DOCUMENT_IDS.SITE,
    _type: 'settings_site',
    title: 'Site Settings',
    brand: {
      _type: 'brand',
      name: tenant.name,
      variant: BRAND_VARIANTS.CONSOLE,
    },
    description:
      `${tenant.name} was just provisioned on the platform. Edit this ` +
      'default description in Site Settings once you have real copy.',
    defaultOgImage: {
      _type: 'imageWithAlt',
      asset: { _type: 'reference', _ref: assets.ogImageAssetId },
      alt: `${tenant.name} social share image`,
    },
  };

  return [
    author,
    topic,
    post,
    navigation,
    footer,
    theme,
    voice,
    newsletter,
    site,
  ];
}
