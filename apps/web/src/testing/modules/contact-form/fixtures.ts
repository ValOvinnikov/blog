import { faker } from '@faker-js/faker';
import { BRAND_VARIANT } from '@shinefold/config';
import type { TContactFormModule } from '@shinefold/service';
import { createMockFaker } from '@web/testing/mock-faker';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

const mockFaker = createMockFaker(61042);

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
  name: mockFaker.person.fullName(),
  email: mockFaker.internet.email(),
  message: mockFaker.lorem.sentences(2),
};
