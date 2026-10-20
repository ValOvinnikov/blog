import type {
  Page_home,
  Page_postIndex,
  Settings_footer,
  Settings_navigation,
  Settings_site,
  Template_home,
  Template_postIndex,
} from '@blog/config/sanity/generated/types';

import {
  reference,
  seo,
  type TStarterDocument,
  type TStarterDocumentUnion,
  type TStarterPage,
} from './starter-document';

const STARTER_DOCUMENT_IDS = {
  NAVIGATION: 'provisioning.settings.navigation',
  FOOTER: 'provisioning.settings.footer',
  SITE: 'provisioning.settings.site',
  HOME_TEMPLATE: 'provisioning.template.home',
  HOME: 'provisioning.settings.home',
  POST_INDEX_TEMPLATE: 'provisioning.template.postIndex',
  POST_INDEX: 'provisioning.page.postIndex',
} as const;

// Static, because a site name is only `min(1)` and can't be sized to `seoSchema`'s 30-60 char `metaTitle`.
const HOME_SEO_META_TITLE =
  'Welcome to your new site — built and ready to customize';
const HOME_SEO_META_DESCRIPTION =
  'This home page was seeded automatically during provisioning. Edit its ' +
  'Heading Block and SEO fields on this page once you have real copy.';
const POST_INDEX_SEO_META_TITLE = 'Blog — the latest posts from this site';
const POST_INDEX_SEO_META_DESCRIPTION =
  'Every post on this site, newest first. Edit this page’s Heading Block ' +
  'and SEO fields once you have real copy.';

function buildHomeDocuments(): TStarterDocumentUnion[] {
  const template = {
    _id: STARTER_DOCUMENT_IDS.HOME_TEMPLATE,
    _type: 'template_home',
    title: 'Home Template',
  } satisfies TStarterDocument<Template_home, 'title'>;

  const page = {
    _id: STARTER_DOCUMENT_IDS.HOME,
    _type: 'page_home',
    title: 'Home',
    headingBlock: {
      _type: 'pageHeadingBlock',
      heading: 'Welcome',
      supportingText:
        'Your new site is ready — start adding pages, posts, and content whenever you like.',
    },
    template: reference(template._id),
    seo: seo(HOME_SEO_META_TITLE, HOME_SEO_META_DESCRIPTION),
  } satisfies TStarterPage<Page_home>;

  return [template, page];
}

function buildPostIndexDocuments(): TStarterDocumentUnion[] {
  const template = {
    _id: STARTER_DOCUMENT_IDS.POST_INDEX_TEMPLATE,
    _type: 'template_postIndex',
    title: 'Post Index Template',
  } satisfies TStarterDocument<Template_postIndex, 'title'>;

  const page = {
    _id: STARTER_DOCUMENT_IDS.POST_INDEX,
    _type: 'page_postIndex',
    title: 'Blog',
    headingBlock: {
      _type: 'pageHeadingBlock',
      heading: 'Blog',
      supportingText: 'The latest posts from this site.',
    },
    template: reference(template._id),
    seo: seo(POST_INDEX_SEO_META_TITLE, POST_INDEX_SEO_META_DESCRIPTION),
  } satisfies TStarterPage<Page_postIndex>;

  return [template, page];
}

export function buildStarterDocuments(
  siteName: string,
): TStarterDocumentUnion[] {
  return [
    {
      _id: STARTER_DOCUMENT_IDS.NAVIGATION,
      _type: 'settings_navigation',
      title: 'Primary Navigation',
      items: [],
    } satisfies TStarterDocument<Settings_navigation, 'title'>,
    {
      _id: STARTER_DOCUMENT_IDS.FOOTER,
      _type: 'settings_footer',
      title: 'Footer',
    } satisfies TStarterDocument<Settings_footer, 'title'>,
    {
      _id: STARTER_DOCUMENT_IDS.SITE,
      _type: 'settings_site',
      title: 'Site Settings',
      currency: 'USD',
      brand: { _type: 'brand', name: siteName },
    } satisfies TStarterDocument<Settings_site, 'title'>,
    ...buildHomeDocuments(),
    ...buildPostIndexDocuments(),
  ];
}
