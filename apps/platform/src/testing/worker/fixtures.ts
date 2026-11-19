import { createMockFaker } from '@platform/testing/mock-faker';

const workerFaker = createMockFaker(5997);

export const MOCK_WORKER_URL = `https://${workerFaker.internet.domainName()}`;
export const MOCK_WORKER_SECRET = workerFaker.string.alphanumeric(32);
