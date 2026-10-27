import {
  mockMigrationDocument,
  runDocumentMigration,
} from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import { del } from 'sanity/migrate';

import migration from './index';

faker.seed(17000);

const MOCK_THEME_ID = faker.string.uuid();

describe('retire-settings-theme', () => {
  it.each([MOCK_THEME_ID, `drafts.${MOCK_THEME_ID}`])(
    'deletes %s',
    async (id) => {
      const theme = mockMigrationDocument({ _id: id, _type: 'settings_theme' });

      const mutations = await runDocumentMigration(migration, theme);

      expect(mutations).toEqual([del(id)]);
    },
  );
});
