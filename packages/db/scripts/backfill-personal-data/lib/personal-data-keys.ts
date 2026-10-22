import { env } from '@blog/db/utils/env/env';
import {
  type IPersonalDataKeyring,
  parsePersonalDataKeyring,
} from '@blog/utils/encryption';

export type TPersonalDataKeys = {
  keyring: IPersonalDataKeyring;
  indexKey: string;
};

export function loadPersonalDataKeys(): TPersonalDataKeys {
  const {
    PERSONAL_DATA_ENCRYPTION_KEY: rawKeyring,
    PERSONAL_DATA_INDEX_KEY: indexKey,
  } = env;

  if (!rawKeyring || !indexKey) {
    throw new Error(
      'backfill-personal-data: PERSONAL_DATA_ENCRYPTION_KEY and PERSONAL_DATA_INDEX_KEY must both be set.',
    );
  }

  return { keyring: parsePersonalDataKeyring(rawKeyring), indexKey };
}
