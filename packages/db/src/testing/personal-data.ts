import type { TMaybeNull } from '@blog/config/types';
import {
  accountEmailIndex,
  decryptPersonalData,
  parsePersonalDataKeyring,
  personalDataIndex,
} from '@blog/utils/encryption';
import {
  MOCK_OTHER_ENCRYPTION_KEY,
  MOCK_ENCRYPTION_KEY,
} from '@blog/utils/encryption/encryption-fixtures';
import { isNull } from '@blog/utils/primitives';

const TEST_KEYRING = `v1:${MOCK_ENCRYPTION_KEY}`;

export const TEST_PERSONAL_DATA_ENV = {
  PERSONAL_DATA_ENCRYPTION_KEY: TEST_KEYRING,
  PERSONAL_DATA_INDEX_KEY: MOCK_OTHER_ENCRYPTION_KEY,
};

export function usePersonalDataKeys(): void {
  beforeEach(() => {
    Object.entries(TEST_PERSONAL_DATA_ENV).forEach(([name, value]) =>
      vi.stubEnv(name, value),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });
}

export function decryptTestPersonalValue(
  encrypted: TMaybeNull<string>,
): TMaybeNull<string> {
  return isNull(encrypted)
    ? null
    : decryptPersonalData(encrypted, parsePersonalDataKeyring(TEST_KEYRING));
}

export function testPersonalEmailIndex(email: string): string {
  return personalDataIndex(email, MOCK_OTHER_ENCRYPTION_KEY);
}

export function mockAccountEmailIndex(email: string): string {
  return accountEmailIndex(email, MOCK_OTHER_ENCRYPTION_KEY);
}
