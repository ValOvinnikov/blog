import { q } from '#/sanity/query';
import { imageWithAltFragment } from '#/shared/fragments/image';
import { openGraphFragment } from '#/shared/fragments/open-graph';
import { socialLinkFragment } from '#/shared/fragments/social-link';

export const siteSettingsQuery = q.star
  .filterByType('siteSettings')
  .slice(0)
  .project((sub) => ({
    title: sub.field('title').notNull(),
    description: sub.field('description').notNull(),
    tagline: sub.field('tagline'),
    brandPrefix: sub.field('brandPrefix').notNull(),
    brandSuffix: sub.field('brandSuffix'),
    logo: sub.field('logo').project(imageWithAltFragment).notNull(),
    defaultSeo: sub.field('defaultSeo').project(openGraphFragment).notNull(),
    navigation: sub
      .field('navigation[]')
      .project((s) => ({
        label: s.field('label').notNull(),
        href: s.field('href').notNull(),
      }))
      .nullable(true),
    socialLinks: sub
      .field('socialLinks[]')
      .project(socialLinkFragment)
      .nullable(true),
  }))
  .notNull();
