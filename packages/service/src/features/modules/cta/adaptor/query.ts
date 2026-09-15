import { q } from '@blog/service/sanity/query';
import { ctaButtonFragment } from '@blog/service/shared/fragments/cta-button';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block';
import { sanityImageFragment } from '@blog/service/shared/fragments/image';
import { layoutFragment } from '@blog/service/shared/fragments/layout';
import { portableTextMarkDefFragment } from '@blog/service/shared/fragments/portable-text-mark-def';

export const ctaModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_cta')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    variant: sub.field('variant').notNull(),
    brandVariant: sub.field('brandVariant').notNull(),
    bandTone: sub.field('bandTone').notNull(),
    eyebrow: sub.field('eyebrow').nullable(true),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    // Blocks are spread as-is (`'...': true`); only `markDefs` is
    // re-projected, to resolve each `linkRef` mark's `link` document.
    content: sub
      .field('content[]')
      .project((blockSub) => ({
        '...': true,
        markDefs: blockSub
          .field('markDefs[]')
          .project(portableTextMarkDefFragment)
          .nullable(true),
      }))
      .nullable(true),
    // Not `.notNull()` — required only for Banner/Split via a custom
    // validator, not `.required()`, so it's genuinely absent for Callout.
    image: sub.field('image').project(sanityImageFragment).nullable(true),
    contentPositionSplit: sub.field('contentPositionSplit').nullable(true),
    contentPositionBanner: sub.field('contentPositionBanner').nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    mobileMediaOrder: sub.field('mobileMediaOrder').nullable(true),
    ctaButtons: sub
      .field('ctaButtons[]')
      .project(ctaButtonFragment)
      .nullable(true),
    footnote: sub.field('footnote').nullable(true),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
