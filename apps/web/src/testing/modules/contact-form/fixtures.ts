import { BRAND_VARIANT } from '@blog/config';
import type { TContactFormModule } from '@blog/service';
import { faker } from '@faker-js/faker';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

faker.seed(61042);

export const mockContactFormModule = (
  overrides: Partial<TContactFormModule> = {},
): TContactFormModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({
    heading: faker.company.catchPhrase(),
    supportingText: faker.lorem.sentence(),
  }),
  successMessage: faker.lorem.sentence(),
  privacyNote: undefined,
  layout: undefined,
  contentAlignment: undefined,
  ...overrides,
});

export const MOCK_CONTACT_MESSAGE = {
  name: faker.person.fullName(),
  email: faker.internet.email(),
  message: faker.lorem.sentences(2),
};
