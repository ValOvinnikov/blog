import { q } from '@blog/service/sanity/query';
import { imageWithAltFragment } from '@blog/service/shared/fragments/image';
import { openGraphFragment } from '@blog/service/shared/fragments/open-graph';

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
        logo: b.field('logo').project(imageWithAltFragment).notNull(),
      }))
      .notNull(),
    description: sub.field('description').notNull(),
    tagline: sub.field('tagline').nullable(true),
    defaultSeo: sub.field('defaultSeo').project(openGraphFragment).notNull(),
  }))
  .notNull();
