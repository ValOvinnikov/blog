import { faker } from '@faker-js/faker';

import {
  DRY_RUN_OFF,
  parseDryRun,
  parseFlagValue,
  readOptionalTenantId,
  readRequiredTenantId,
} from './cli-flags';

faker.seed(7422);

const MOCK_TENANT_ID = faker.string.uuid();
const MOCK_ENV_TENANT_ID = faker.string.uuid();
const MOCK_TOOL = 'mock-tool';
const MOCK_FLAG = '--mock=';
const MOCK_FLAG_VALUE = faker.lorem.word();

beforeEach(() => {
  vi.stubEnv('TENANT_ID', undefined);
  vi.stubEnv('DRY_RUN', undefined);
});

describe(parseFlagValue, () => {
  it('returns the text after the flag prefix', () => {
    expect(parseFlagValue([`${MOCK_FLAG}${MOCK_FLAG_VALUE}`], MOCK_FLAG)).toBe(
      MOCK_FLAG_VALUE,
    );
  });

  it('returns undefined when the flag is absent', () => {
    expect(parseFlagValue([], MOCK_FLAG)).toBeUndefined();
  });
});

describe(readOptionalTenantId, () => {
  it('returns undefined when neither the flag nor the env var is set', () => {
    expect(readOptionalTenantId([])).toBeUndefined();
  });

  describe('when the TENANT_ID env var is set', () => {
    beforeEach(() => {
      vi.stubEnv('TENANT_ID', MOCK_ENV_TENANT_ID);
    });

    it('reads the flag over the env var', () => {
      expect(readOptionalTenantId([`--tenant-id=${MOCK_TENANT_ID}`])).toBe(
        MOCK_TENANT_ID,
      );
    });

    it('falls back to the env var when the flag is empty', () => {
      expect(readOptionalTenantId(['--tenant-id='])).toBe(MOCK_ENV_TENANT_ID);
    });
  });
});

describe(readRequiredTenantId, () => {
  it('returns the tenant id when one is given', () => {
    expect(
      readRequiredTenantId([`--tenant-id=${MOCK_TENANT_ID}`], MOCK_TOOL),
    ).toBe(MOCK_TENANT_ID);
  });

  it('throws naming the tool and the flag when none is given', () => {
    expect(() => readRequiredTenantId([], MOCK_TOOL)).toThrow(
      `${MOCK_TOOL}: missing required --tenant-id=<uuid> (or TENANT_ID env var).`,
    );
  });
});

describe(parseDryRun, () => {
  it.each([
    { argv: [], isDryRun: true },
    { argv: [`--dry-run=${DRY_RUN_OFF}`], isDryRun: false },
    { argv: ['--dry-run'], isDryRun: true },
    { argv: ['--dry-run=no'], isDryRun: true },
  ])('returns $isDryRun for $argv', ({ argv, isDryRun }) => {
    expect(parseDryRun(argv)).toBe(isDryRun);
  });

  describe('when the DRY_RUN env var is false', () => {
    beforeEach(() => {
      vi.stubEnv('DRY_RUN', DRY_RUN_OFF);
    });

    it('applies changes', () => {
      expect(parseDryRun([])).toBe(false);
    });

    it('lets --dry-run=true override it', () => {
      expect(parseDryRun(['--dry-run=true'])).toBe(true);
    });
  });
});
