import { q } from '#/sanity/query';

// `alt` is our field (required); the rest are Sanity's built-in image fields.
export const imageWithAltFragment = q
  .fragmentForType<'imageWithAlt'>()
  .project((sub) => ({
    _type: true,
    asset: true,
    alt: sub.field('alt').notNull(),
    hotspot: true,
    crop: true,
  }));
