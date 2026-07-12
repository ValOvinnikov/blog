import { q } from '@blog/service/sanity/query';

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

// Dereferences the asset to expose the fields `sanity-image` needs
// (asset id, blur placeholder, dimensions) alongside `alt`/`hotspot`/`crop`.
export const sanityImageFragment = q
  .fragmentForType<'imageWithAlt'>()
  .project((sub) => ({
    alt: sub.field('alt').notNull(),
    hotspot: true,
    crop: true,
    asset: sub
      .field('asset')
      .deref()
      .project((assetSub) => ({
        _id: true,
        metadata: assetSub.field('metadata').project((metaSub) => ({
          lqip: metaSub.field('lqip'),
          dimensions: metaSub.field('dimensions').project((dimSub) => ({
            width: dimSub.field('width'),
            height: dimSub.field('height'),
            aspectRatio: dimSub.field('aspectRatio'),
          })),
        })),
      }))
      .notNull(),
  }));
