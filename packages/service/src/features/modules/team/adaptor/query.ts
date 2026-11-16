import {
  q,
  type TModuleQueryParams,
} from '@shinefold/service/sanity/query/query';
import {
  DISPLAY_MODE_EXPRESSION,
  displayModeParser,
} from '@shinefold/service/shared/expressions/module/display-mode';
import { ctaButtonsFragment } from '@shinefold/service/shared/fragments/cta/cta-buttons';
import { moduleHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/module-heading-block';
import { moduleWideLayoutFragment } from '@shinefold/service/shared/fragments/layout/layout';
import { moduleAppearanceFragment } from '@shinefold/service/shared/fragments/module/module-appearance';
import { moduleContentAlignmentLeftCenterFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';
import { personDetailFragment } from '@shinefold/service/shared/fragments/person/person';
import { z } from 'zod';

export const teamModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_team')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .notNull(),
    members: sub
      .field('members[]')
      .deref()
      .project(personDetailFragment)
      .notNull(),
    showBios: sub.raw('coalesce(showBios, false)', z.boolean()),
    showSocialLinks: sub.raw('coalesce(showSocialLinks, true)', z.boolean()),
    imageShape: sub.field('imageShape').notNull(),
    displayMode: sub.raw(DISPLAY_MODE_EXPRESSION, displayModeParser),
    cardAlignment: sub.field('cardAlignment').notNull(),
    ...ctaButtonsFragment,
    ...moduleContentAlignmentLeftCenterFragment,
    ...moduleWideLayoutFragment,
    ...moduleAppearanceFragment,
  }))
  .notNull();
