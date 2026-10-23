import { faker } from '@faker-js/faker';

export const MOCK_ERROR = new Error(faker.lorem.sentence());

export const MOCK_ERROR_DIGEST = faker.string.uuid();

export const MOCK_ERROR_WITH_DIGEST = Object.assign(
  new Error(faker.lorem.sentence()),
  { digest: MOCK_ERROR_DIGEST },
);
