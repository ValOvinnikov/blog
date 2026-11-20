import { createMockFaker } from '@web/testing/mock-faker';
import { unstable_isUnrecognizedActionError } from 'next/navigation';

const mockFaker = createMockFaker(77531);

export const MOCK_UNRECOGNIZED_ACTION_ERROR = new Error(
  mockFaker.lorem.sentence(),
);

export const mockUnrecognizedActionError = () => {
  vi.mocked(unstable_isUnrecognizedActionError).mockImplementation(
    (error) => error === MOCK_UNRECOGNIZED_ACTION_ERROR,
  );
};
