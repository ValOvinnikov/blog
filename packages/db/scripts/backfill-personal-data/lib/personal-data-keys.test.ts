import { usePersonalDataKeys } from '@blog/db/testing/personal-data';

import { loadPersonalDataKeys } from './personal-data-keys';

describe(loadPersonalDataKeys, () => {
  usePersonalDataKeys();

  it('loads the encryption keyring and the index key', () => {
    expect(loadPersonalDataKeys()).toEqual({
      keyring: expect.objectContaining({ currentVersion: 'v1' }),
      indexKey: expect.any(String),
    });
  });

  it.each(['PERSONAL_DATA_ENCRYPTION_KEY', 'PERSONAL_DATA_INDEX_KEY'])(
    'refuses to run when %s is unset',
    (name) => {
      vi.stubEnv(name, '');

      expect(() => loadPersonalDataKeys()).toThrow(name);
    },
  );
});
