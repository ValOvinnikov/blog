import {
  mockMigrationDocument,
  runDocumentMigration,
} from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import { del } from 'sanity/migrate';

import migration from './index';

faker.seed(18060);

const MOCK_VOICE_ID = faker.string.uuid();

describe('delete-orphaned-settings-voice', () => {
  it.each([MOCK_VOICE_ID, `drafts.${MOCK_VOICE_ID}`])(
    'deletes %s',
    async (id) => {
      const voice = mockMigrationDocument({ _id: id, _type: 'settings_voice' });

      const mutations = await runDocumentMigration(migration, voice);

      expect(mutations).toEqual([del(id)]);
    },
  );
});
