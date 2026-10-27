import { faker } from '@faker-js/faker';

faker.seed(2210);

export const MOCK_DATABASE_URL = `postgresql://${faker.internet.username()}:${faker.internet.password()}@${faker.internet.domainName()}/${faker.word.noun()}`;
