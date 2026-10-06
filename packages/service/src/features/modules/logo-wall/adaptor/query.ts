import { q, type TModuleQueryParams } from '@blog/service/sanity/query/query';
import {
  DISPLAY_MODE_EXPRESSION,
  displayModeParser,
} from '@blog/service/shared/expressions/module/display-mode';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { moduleHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/module-heading-block';
import { sanityImageAssetFragment } from '@blog/service/shared/fragments/image/image';
import { moduleLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link/link-document';
import { moduleContentAlignmentLeftCenterFragment } from '@blog/service/shared/fragments/module/module-content-alignment';

export const logoWallModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_logoWall')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .notNull(),
    logos: sub
      .field('logos[]')
      .project((logoSub) => ({
        _key: true,
        name: logoSub.field('name').notNull(),
        image: logoSub
          .field('image')
          .project((imageSub) => ({
            asset: imageSub
              .field('asset')
              .deref()
              .project(sanityImageAssetFragment)
              .notNull(),
            hotspot: true,
            crop: true,
          }))
          .notNull(),
        imageDark: logoSub
          .field('imageDark')
          .project((imageSub) => ({
            asset: imageSub
              .field('asset')
              .deref()
              .project(sanityImageAssetFragment)
              .nullable(true),
            hotspot: true,
            crop: true,
          }))
          .nullable(true),
        link: logoSub
          .field('link')
          .deref()
          .project(linkDocumentFragment)
          .nullable(true),
      }))
      .notNull(),
    ...ctaButtonsFragment,
    displayMode: sub.raw(DISPLAY_MODE_EXPRESSION, displayModeParser),
    ...moduleContentAlignmentLeftCenterFragment,
    ...moduleLayoutFragment,
  }))
  .notNull();
