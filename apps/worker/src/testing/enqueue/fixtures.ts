import { faker } from '@faker-js/faker';

faker.seed(6025);

export const MOCK_ENQUEUE_SECRET = faker.string.alphanumeric(32);
export const MOCK_FORGED_SECRET = 'forged-secret';
