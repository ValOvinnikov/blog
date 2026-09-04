import { q } from '@blog/service/sanity/query';
import { actionGroupFragment } from '@blog/service/shared/fragments/action-group';
import { sanityImageFragment } from '@blog/service/shared/fragments/image';
import { layoutFragment } from '@blog/service/shared/fragments/layout';
import { linkFragment } from '@blog/service/shared/fragments/link';
import { requiredSectionHeaderFragment } from '@blog/service/shared/fragments/section-header';

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
    sectionHeader: sub
      .field('sectionHeader')
      .project(requiredSectionHeaderFragment)
      .notNull(),
    // Blocks are spread as-is (`'...': true`); only `markDefs` is
    // re-projected, to deref `link` annotations' `internalReference`.
    content: sub
      .field('content[]')
      .project((blockSub) => ({
        '...': true,
        markDefs: blockSub
          .field('markDefs[]')
          .project({
            _key: true,
            _type: true,
            ...linkFragment,
          })
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
    actions: sub.field('actions').project(actionGroupFragment).nullable(true),
    footnote: sub.field('footnote').nullable(true),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
