import { q } from '@blog/service/sanity/query';
import { imageWithAltFragment } from '@blog/service/shared/fragments/image';

export const siteSettingsQuery = q.star
  .filterByType('settings_site')
  .slice(0)
  .project((sub) => ({
    brand: sub
      .field('brand')
      .project((b) => ({
        name: b.field('name').notNull(),
        prefix: b.field('prefix').notNull(),
        suffix: b.field('suffix').nullable(true),
        specLine: b
          .field('specLine')
          .project((sl) => ({
            items: sl.field('items[]').nullable(true),
            separator: sl.field('separator').notNull(),
          }))
          .nullable(true),
        logo: b.field('logo').project(imageWithAltFragment).notNull(),
        variant: b.field('variant').notNull(),
      }))
      .notNull(),
    description: sub.field('description').notNull(),
    tagline: sub.field('tagline').nullable(true),
    defaultOgImage: sub
      .field('defaultOgImage')
      .project(imageWithAltFragment)
      .notNull(),
  }))
  .notNull();
