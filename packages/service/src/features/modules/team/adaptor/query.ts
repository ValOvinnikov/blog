import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import {
  DISPLAY_MODE_EXPRESSION,
  displayModeParser,
} from '@blog/service/shared/expressions/module/display-mode';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { moduleWideLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentLeftCenterFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { personDetailFragment } from '@blog/service/shared/fragments/person/person';
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
      .project(headingBlockFragment)
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
  }))
  .notNull();
