import { BRAND_VARIANT, NEWSLETTER_VARIANT } from '@blog/config/constants';

/**
 * Fixed ids for the two modules every migrated `page_post` shares, following
 * the `STARTER_DOCUMENT_IDS` fixed-id pattern
 * (`packages/db/scripts/provision-tenant/steps/starter-content.ts`).
 */
export const SHARED_MODULE_IDS = {
  POST_RELATED: 'page-post.module.postRelated',
  NEWSLETTER: 'page-post.module.newsletter',
} as const;

export const sharedPostRelatedModule = {
  _id: SHARED_MODULE_IDS.POST_RELATED,
  _type: 'module_postRelated',
  title: 'Related reading',
  brandVariant: BRAND_VARIANT.PRIMARY,
  limit: 3,
};

export const sharedNewsletterModule = {
  _id: SHARED_MODULE_IDS.NEWSLETTER,
  _type: 'module_newsletter',
  title: 'Post Newsletter (Compact)',
  brandVariant: BRAND_VARIANT.PRIMARY,
  sectionHeader: { heading: 'Subscribe for updates' },
  variant: NEWSLETTER_VARIANT.COMPACT,
};
