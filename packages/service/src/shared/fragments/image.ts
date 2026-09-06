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

// Exposes the fields `sanity-image` needs from a dereferenced asset
// (asset id, blur placeholder, dimensions). Shared by every fragment below
// that derefs an image asset, whether or not the reference itself is required.
const sanityImageAssetFragment = q
  .fragmentForType<'sanity.imageAsset'>()
  .project((sub) => ({
    _id: true,
    metadata: sub
      .field('metadata')
      .project((metaSub) => ({
        lqip: metaSub.field('lqip').nullable(true),
        dimensions: metaSub
          .field('dimensions')
          .project((dimSub) => ({
            width: dimSub.field('width').nullable(true),
            height: dimSub.field('height').nullable(true),
            aspectRatio: dimSub.field('aspectRatio').nullable(true),
          }))
          .nullable(true),
      }))
      .nullable(true),
  }));

// Dereferences the asset to expose the fields `sanity-image` needs alongside
// `alt`/`hotspot`/`crop`. Used where the image field, once present, is
// expected to always carry a resolved asset (hero, avatar, brand, OG).
export const sanityImageFragment = q
  .fragmentForType<'imageWithAlt'>()
  .project((sub) => ({
    alt: sub.field('alt').notNull(),
    hotspot: true,
    crop: true,
    asset: sub
      .field('asset')
      .deref()
      .project(sanityImageAssetFragment)
      .notNull(),
  }));

// Same asset resolution as `sanityImageFragment`, but both `asset` and
// `alt` stay nullable so a malformed body-image block degrades gracefully
// instead of failing the whole document.
export const bodyImageFragment = q
  .fragmentForType<'bodyImage'>()
  .project((sub) => ({
    alt: sub.field('alt').nullable(true),
    hotspot: true,
    crop: true,
    asset: sub
      .field('asset')
      .deref()
      .project(sanityImageAssetFragment)
      .nullable(true),
  }));
