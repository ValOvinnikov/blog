import { q } from '@blog/service/sanity/query';

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

// Same asset resolution as `sanityImageFragment`, and the same required
// `alt` (both types compose `imageAltField()`). Only `asset` stays nullable,
// so a body-image block whose asset was never selected or points at a
// deleted document degrades gracefully instead of failing the whole
// document.
export const bodyImageFragment = q
  .fragmentForType<'bodyImage'>()
  .project((sub) => ({
    alt: sub.field('alt').notNull(),
    hotspot: true,
    crop: true,
    asset: sub
      .field('asset')
      .deref()
      .project(sanityImageAssetFragment)
      .nullable(true),
  }));
