import { faker } from '@faker-js/faker';

faker.seed(6026);

export const MOCK_ENQUEUE_SECRET = faker.string.alphanumeric(32);
export const MOCK_FORGED_SECRET = faker.string.alphanumeric(32);
export const MOCK_WORKER_ORIGIN = faker.internet.url({ appendSlash: false });
