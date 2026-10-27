import { BRAND_VARIANT, NEWSLETTER_VARIANT } from '@blog/config';
import type { TNewsletterModule } from '@blog/service';
import { faker } from '@faker-js/faker';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

faker.seed(61051);

export const mockNewsletterModule = (
  overrides: Partial<TNewsletterModule> = {},
): TNewsletterModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({
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

export const MOCK_NEWSLETTER_MODULE_ID = faker.string.uuid();
