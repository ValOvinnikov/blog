import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import type { THeroStatementModule } from '@blog/service';
import { faker } from '@faker-js/faker';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

faker.seed(61045);

export const MOCK_HERO_STATEMENT_MODULE_ID = faker.string.uuid();

export const MOCK_HERO_STATEMENT_HEADING = faker.company.catchPhrase();

export const mockHeroStatementModule = (
  overrides: Partial<THeroStatementModule> = {},
): THeroStatementModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  headingBlock: mockHeadingBlock({ heading: MOCK_HERO_STATEMENT_HEADING }),
  sanityImage: undefined,
  ctaButtons: [],
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
  ...overrides,
});
