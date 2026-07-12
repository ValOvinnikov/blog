import { q } from '#/sanity/query';
import { imageWithAltFragment } from '#/shared/fragments/image';
import { openGraphFragment } from '#/shared/fragments/open-graph';

export const siteSettingsQuery = q.star
  .filterByType('settings_site')
  .slice(0)
  .project((sub) => ({
    brand: sub
      .field('brand')
      .project((b) => ({
        name: b.field('name').notNull(),
        prefix: b.field('prefix').notNull(),
        suffix: b.field('suffix'),
        logo: b.field('logo').project(imageWithAltFragment).notNull(),
      }))
      .notNull(),
    description: sub.field('description').notNull(),
    tagline: sub.field('tagline'),
    defaultSeo: sub.field('defaultSeo').project(openGraphFragment).notNull(),
  }))
  .notNull();
