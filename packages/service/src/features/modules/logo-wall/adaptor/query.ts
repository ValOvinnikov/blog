import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import {
  DISPLAY_MODE_EXPRESSION,
  displayModeParser,
} from '@blog/service/shared/expressions/display-mode';
import { ctaButtonFragment } from '@blog/service/shared/fragments/cta/cta-button';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { layoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link/link-document';

export const logoWallModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_logoWall')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    logos: sub
      .field('logos[]')
      .deref()
      .project((logoSub) => ({
        _id: true,
        image: logoSub.field('image').project(sanityImageFragment).notNull(),
        link: logoSub
          .field('link')
          .deref()
          .project(linkDocumentFragment)
          .nullable(true),
      }))
      .notNull(),
    ctaButtons: sub
      .field('ctaButtons[]')
      .project(ctaButtonFragment)
      .nullable(true),
    displayMode: sub.raw(DISPLAY_MODE_EXPRESSION, displayModeParser),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
