import { q } from '#/sanity/query';
import { imageWithAltFragment } from '#/shared/fragments/image';
import { socialLinkFragment } from '#/shared/fragments/social-link';

export const siteSettingsQuery = q.star
  .filterByType('siteSettings')
  .slice(0)
  .project((sub) => ({
    title: sub.field('title').notNull(),
    description: sub.field('description').notNull(),
    tagline: sub.field('tagline'),
    logo: sub.field('logo').project(imageWithAltFragment).notNull(),
    ogImage: sub.field('ogImage').project(imageWithAltFragment).notNull(),
    ogTitle: sub.field('ogTitle'),
    ogDescription: sub.field('ogDescription'),
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
