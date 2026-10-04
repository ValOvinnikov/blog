import type { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config';
import { q } from '@blog/service/sanity/query';

export const sanityImageAssetFragment = q
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

// Same asset resolution as `sanityImageFragment`, but both `asset` and
// `alt` stay nullable so a malformed body-image block degrades gracefully
// instead of failing the whole document.
export const bodyImageFragment = q
  .fragmentForType<typeof PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE>()
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
