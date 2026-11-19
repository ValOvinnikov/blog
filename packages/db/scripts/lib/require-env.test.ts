import { faker } from '@faker-js/faker';

import { requireEnv } from './require-env';

faker.seed(7649);

const MOCK_TOOL = 'mock-tool';
const MOCK_ENV_NAME = 'MOCK_REQUIRED_VAR';
const MOCK_ENV_VALUE = faker.string.alphanumeric(16);

describe(requireEnv, () => {
  it('returns the env var value when set', () => {
    vi.stubEnv(MOCK_ENV_NAME, MOCK_ENV_VALUE);

    expect(requireEnv(MOCK_TOOL, MOCK_ENV_NAME)).toBe(MOCK_ENV_VALUE);
  });

  it.each([undefined, ''])(
    'throws naming the tool when the var is %j',
    (value) => {
      vi.stubEnv(MOCK_ENV_NAME, value);

      expect(() => requireEnv(MOCK_TOOL, MOCK_ENV_NAME)).toThrow(
        'mock-tool: missing required env var MOCK_REQUIRED_VAR.',
      );
    },
  );
});
