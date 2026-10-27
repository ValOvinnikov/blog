import { faker } from '@faker-js/faker';

faker.seed(61035);

export const MOCK_ACCOUNT_USER = {
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
};
