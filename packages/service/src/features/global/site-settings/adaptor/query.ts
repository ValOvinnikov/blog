import { q } from '@blog/service/sanity/query';
import { sanityImageFragment } from '@blog/service/shared/fragments/image';

export const siteSettingsQuery = q.star
  .filterByType('settings_site')
  .slice(0)
  .project((sub) => ({
    brand: sub
      .field('brand')
      .project((b) => ({
        name: b.field('name').notNull(),
        tagline: b
          .field('tagline')
          .project((t) => ({
            items: t.field('items[]').nullable(true),
            separator: t.field('separator').notNull(),
          }))
          .nullable(true),
        logo: b.field('logo').project(sanityImageFragment).nullable(true),
      }))
      .notNull(),
    description: sub.field('description').notNull(),
  }))
  .notNull();
