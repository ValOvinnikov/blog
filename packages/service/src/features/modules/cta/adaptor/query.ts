import { q } from '@blog/service/sanity/query';
import { actionGroupFragment } from '@blog/service/shared/fragments/action-group';
import { sanityImageFragment } from '@blog/service/shared/fragments/image';
import { layoutFragment } from '@blog/service/shared/fragments/layout';
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
    content: sub.field('content[]').nullable(true),
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
