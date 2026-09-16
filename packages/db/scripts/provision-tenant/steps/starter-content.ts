import { PRESET_ID } from '@blog/config/constants';
import type { TTenant } from '@blog/db/schema/tenants';

// Fixed document ids (published, not `drafts.`-prefixed). No generated
// `@blog/config` types exist for a not-yet-created project's dataset, so
// these stay loosely typed (`TSanityDocument`), not `any`.
export const STARTER_DOCUMENT_IDS = {
  NAVIGATION: 'provisioning.settings.navigation',
  FOOTER: 'provisioning.settings.footer',
  THEME: 'provisioning.settings.theme',
  NEWSLETTER: 'provisioning.settings.newsletter',
  SITE: 'provisioning.settings.site',
  HOME: 'provisioning.settings.home',
} as const;

export type TSanityDocument = Record<string, unknown> & {
  _id: string;
  _type: string;
};

// Static, not derived from `tenant.name` — the platform only validates that
// name as `min(1)`, so a name-derived value can't be sized to satisfy
// `seoSchema`'s bounds (`metaTitle` 30-60 chars) for every tenant.
const HOME_SEO_META_TITLE =
  'Welcome to your new site — built and ready to customize';
const HOME_SEO_META_DESCRIPTION =
  'This home page was seeded automatically during provisioning. Edit its ' +
  'Heading Block and SEO fields on this page once you have real copy.';

export function buildStarterDocuments(
  tenant: Pick<TTenant, 'name'>,
): TSanityDocument[] {
  const navigation: TSanityDocument = {
    _id: STARTER_DOCUMENT_IDS.NAVIGATION,
    _type: 'settings_navigation',
    title: 'Primary Navigation',
    items: [],
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
  };

  const home: TSanityDocument = {
    _id: STARTER_DOCUMENT_IDS.HOME,
    _type: 'page_home',
    title: 'Home',
    headingBlock: {
      _type: 'headingBlock',
      heading: 'Welcome',
      supportingText:
        'Your new site is ready — start adding pages, posts, and content whenever you like.',
    },
    seo: {
      _type: 'seo',
      metaTitle: HOME_SEO_META_TITLE,
      metaDescription: HOME_SEO_META_DESCRIPTION,
      openGraph: {
        _type: 'openGraph',
        ogTitle: HOME_SEO_META_TITLE,
        ogDescription: HOME_SEO_META_DESCRIPTION,
      },
    },
  };

  return [navigation, footer, theme, newsletter, site, home];
}
