import { BRAND_VARIANT } from '@blog/config';
import type { TContactFormModule } from '@blog/service';
import { faker } from '@faker-js/faker';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

export const mockContactFormModule = (
  overrides: Partial<TContactFormModule> = {},
): TContactFormModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({
    heading: faker.company.catchPhrase(),
    supportingText: faker.lorem.sentence(),
  }),
  successMessage: faker.lorem.sentence(),
  privacyNote: undefined,
  layout: undefined,
  contentAlignment: undefined,
  ...overrides,
});
