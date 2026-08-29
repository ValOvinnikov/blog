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
    eyebrow: sub.field('eyebrow').nullable(true),
    sectionHeader: sub
      .field('sectionHeader')
      .project(requiredSectionHeaderFragment)
      .notNull(),
    // Blocks are Sanity's built-in Portable Text shape, so `'...': true`
    // spreads them as-is; only `markDefs` is re-projected, to deref `link`
    // annotations' `internalReference` the same way `linkFragment` does for
    // actions (`content` allows only the `link` annotation, so every entry
    // matches `linkFragment`'s shape).
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
    // Not `.notNull()` — required only for Banner/Split, enforced by a
    // custom Studio validator, not `.required()`, so it is genuinely
    // absent for Callout.
    image: sub.field('image').project(sanityImageFragment).nullable(true),
    imageSide: sub.field('imageSide').nullable(true),
    mobileMediaOrder: sub.field('mobileMediaOrder').nullable(true),
    actions: sub.field('actions').project(actionGroupFragment).nullable(true),
    footnote: sub.field('footnote').nullable(true),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
