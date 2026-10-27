import { createMockFaker } from '@blog/db/testing/mock-faker';

const envFaker = createMockFaker(2210);

export const MOCK_DATABASE_URL = `postgresql://${envFaker.internet.username()}:${envFaker.internet.password()}@${envFaker.internet.domainName()}/${envFaker.word.noun()}`;
