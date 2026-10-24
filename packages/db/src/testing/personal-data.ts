import type { TMaybeNull, TMaybeUndefined } from '@blog/config/types';
import {
  onPersonalDataFallback,
  type TPersonalDataFallbackListener,
} from '@blog/db/utils/personal-data/personal-data-fallback';
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
import type { Mock } from 'vitest';

const TEST_KEYRING = `v1:${MOCK_ENCRYPTION_KEY}`;

export function usePersonalDataKeys(): void {
  beforeEach(() => {
    vi.stubEnv('PERSONAL_DATA_ENCRYPTION_KEY', TEST_KEYRING);
    vi.stubEnv('PERSONAL_DATA_INDEX_KEY', MOCK_OTHER_ENCRYPTION_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });
}

export function usePersonalDataFallbackListener(): Mock<TPersonalDataFallbackListener> {
  const listener = vi.fn<TPersonalDataFallbackListener>();
  let stopListening: TMaybeUndefined<() => void>;

  beforeEach(() => {
    listener.mockClear();
    stopListening = onPersonalDataFallback(listener);
  });

  afterEach(() => {
    stopListening?.();
  });

  return listener;
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
