import type { TMaybeNull } from '@blog/config/types';
import {
  decryptPersonalData,
  parsePersonalDataKeyring,
  personalDataIndex,
} from '@blog/utils/encryption';
import {
  OTHER_TEST_ENCRYPTION_KEY,
  TEST_ENCRYPTION_KEY,
} from '@blog/utils/encryption/encryption-fixtures';

const TEST_KEYRING = `v1:${TEST_ENCRYPTION_KEY}`;

export function usePersonalDataKeys(): void {
  beforeEach(() => {
    vi.stubEnv('PERSONAL_DATA_ENCRYPTION_KEY', TEST_KEYRING);
    vi.stubEnv('PERSONAL_DATA_INDEX_KEY', OTHER_TEST_ENCRYPTION_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });
}

export function decryptTestPersonalValue(
  encrypted: TMaybeNull<string>,
): TMaybeNull<string> {
  return encrypted === null
    ? null
    : decryptPersonalData(encrypted, parsePersonalDataKeyring(TEST_KEYRING));
}

export function testPersonalEmailIndex(email: string): string {
  return personalDataIndex(email, OTHER_TEST_ENCRYPTION_KEY);
}
