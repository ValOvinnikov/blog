import { BRAND_VARIANT } from '@blog/config';
import type { TSectionPageCard, TSectionPagesModule } from '@blog/service';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

export const makeSectionPageCard = (
  overrides: Partial<TSectionPageCard> = {},
): TSectionPageCard => ({
  id: 'faq',
  title: 'FAQ',
  summary: 'Answers to the questions we hear most.',
  image: undefined,
  path: 'modules/faq',
  ...overrides,
});

export const makeSectionPagesModule = (
  overrides: Partial<TSectionPagesModule> = {},
): TSectionPagesModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'In this section' }),
  pages: [makeSectionPageCard()],
  contentAlignment: undefined,
  layout: undefined,
  ...overrides,
});
