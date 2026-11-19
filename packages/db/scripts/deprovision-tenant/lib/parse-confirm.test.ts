import { faker } from '@faker-js/faker';

import { parseConfirm } from './parse-confirm';

faker.seed(7650);

const MOCK_TENANT_NAME = faker.lorem.slug();
const MOCK_ENV_TENANT_NAME = faker.lorem.slug();

beforeEach(() => {
  vi.stubEnv('CONFIRM', undefined);
});

describe(parseConfirm, () => {
  it('reads the --confirm flag', () => {
    expect(parseConfirm([`--confirm=${MOCK_TENANT_NAME}`])).toBe(
      MOCK_TENANT_NAME,
    );
  });

  it('falls back to the CONFIRM env var', () => {
    vi.stubEnv('CONFIRM', MOCK_ENV_TENANT_NAME);

    expect(parseConfirm([])).toBe(MOCK_ENV_TENANT_NAME);
  });

  it('throws when neither is set', () => {
    expect(() => parseConfirm([])).toThrow(
      'deprovision-tenant: missing required --confirm=<tenant-name> (or CONFIRM env var).',
    );
  });
});
