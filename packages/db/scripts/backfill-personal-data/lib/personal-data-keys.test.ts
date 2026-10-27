import {
  decryptTestPersonalValue,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { encryptPersonalData, personalDataIndex } from '@blog/utils/encryption';
import { faker } from '@faker-js/faker';

import { loadPersonalDataKeys } from './personal-data-keys';

faker.seed(5807);

const MOCK_PLAINTEXT = faker.lorem.sentence();
const MOCK_EMAIL = faker.internet.email();

describe(loadPersonalDataKeys, () => {
  usePersonalDataKeys();

  it('loads the keyring that encrypts personal values', () => {
    const { keyring } = loadPersonalDataKeys();

    const encrypted = encryptPersonalData(MOCK_PLAINTEXT, keyring);

    expect(decryptTestPersonalValue(encrypted)).toBe(MOCK_PLAINTEXT);
  });

  it('loads the index key that indexes email addresses', () => {
    const { indexKey } = loadPersonalDataKeys();

    expect(personalDataIndex(MOCK_EMAIL, indexKey)).toBe(
      testPersonalEmailIndex(MOCK_EMAIL),
    );
  });

  it.each(['PERSONAL_DATA_ENCRYPTION_KEY', 'PERSONAL_DATA_INDEX_KEY'])(
    'refuses to run when %s is unset',
    (name) => {
      vi.stubEnv(name, '');

      expect(() => loadPersonalDataKeys()).toThrow(name);
    },
  );
});
