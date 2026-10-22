import { env } from '@blog/db/utils/env/env';
import { personalDataIndex } from '@blog/utils/encryption';

export function signupAddressIndex(address: string): string {
  if (!env.PERSONAL_DATA_INDEX_KEY) {
    throw new Error('PERSONAL_DATA_INDEX_KEY is not configured.');
  }

  return personalDataIndex(address, env.PERSONAL_DATA_INDEX_KEY);
}
