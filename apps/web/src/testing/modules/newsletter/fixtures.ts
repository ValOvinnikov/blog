import { BRAND_VARIANT, NEWSLETTER_VARIANT } from '@blog/config';
import type { TNewsletterModule } from '@blog/service';
import { faker } from '@faker-js/faker';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

export const makeNewsletterModule = (
  overrides: Partial<TNewsletterModule> = {},
): TNewsletterModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({
    heading: faker.company.catchPhrase(),
    supportingText: faker.lorem.sentence(),
  }),
  content: undefined,
  variant: NEWSLETTER_VARIANT.FULL,
  trustCues: [faker.lorem.words(2), faker.lorem.words(3)],
  layout: undefined,
  contentAlignment: undefined,
  ...overrides,
});
