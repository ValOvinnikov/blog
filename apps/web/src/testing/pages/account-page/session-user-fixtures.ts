import { createMockFaker } from '@web/testing/mock-faker';

const mockFaker = createMockFaker(61035);

export const MOCK_ACCOUNT_USER = {
  id: mockFaker.string.uuid(),
  name: mockFaker.person.fullName(),
  email: mockFaker.internet.email(),
};
