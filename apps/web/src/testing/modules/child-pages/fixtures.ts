import { BRAND_VARIANT } from '@blog/config';
import type { TChildPageCard, TChildPagesModule } from '@blog/service';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

export const makeChildPageCard = (
  overrides: Partial<TChildPageCard> = {},
): TChildPageCard => ({
  id: 'faq',
  title: 'FAQ',
  summary: 'Answers to the questions we hear most.',
  image: undefined,
  path: 'modules/faq',
  ...overrides,
});

export const makeChildPagesModule = (
  overrides: Partial<TChildPagesModule> = {},
): TChildPagesModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'In this section' }),
  pages: [makeChildPageCard()],
  contentAlignment: undefined,
  layout: undefined,
  ...overrides,
});
