import {
  mockMigrationContext,
  mockMigrationDocument,
  runDocumentMigration,
} from '@blog/studio/testing/migrations/migration-document';
import { faker } from '@faker-js/faker';
import { del } from 'sanity/migrate';

import migration, { findModulesMissingCopiedCues } from './index';

faker.seed(19000);

const MOCK_SETTINGS_ID = faker.string.uuid();
const MOCK_DRAFT_SETTINGS_ID = `drafts.${MOCK_SETTINGS_ID}`;
const MOCK_TRUST_CUE = faker.lorem.words(2);
const MOCK_COPIED_CUE = {
  _key: faker.string.alphanumeric(12),
  _type: 'newsletterTrustCue',
};

const mockSettings = (_id: string) =>
  mockMigrationDocument({
    _id,
    _type: 'settings_newsletter',
    trustCues: [MOCK_TRUST_CUE],
  });

const mockNewsletterModule = (trustCues?: unknown[]) =>
  mockMigrationDocument({ _type: 'module_newsletter', trustCues });

describe(findModulesMissingCopiedCues, () => {
  it('reports a module without cues while the settings still carry some', () => {
    const copied = { _id: faker.string.uuid(), trustCues: [MOCK_COPIED_CUE] };
    const missing = { _id: faker.string.uuid() };

    const result = findModulesMissingCopiedCues({
      settingsTrustCues: [MOCK_TRUST_CUE],
      modules: [copied, missing],
    });

    expect(result).toEqual([missing._id]);
  });

  it.each([
    ['no settings cues', null],
    ['only blank settings cues', ['', ' ']],
  ])(
    'reports nothing when there are %s to lose',
    (_label, settingsTrustCues) => {
      const result = findModulesMissingCopiedCues({
        settingsTrustCues,
        modules: [{ _id: faker.string.uuid() }],
      });

      expect(result).toEqual([]);
    },
  );
});

describe('retire-newsletter-settings', () => {
  it.each([MOCK_SETTINGS_ID, MOCK_DRAFT_SETTINGS_ID])(
    'deletes %s once every module carries the copied cues',
    async (id) => {
      const settings = mockSettings(id);
      const context = mockMigrationContext([
        mockSettings(MOCK_SETTINGS_ID),
        mockNewsletterModule([MOCK_COPIED_CUE]),
      ]);

      const mutations = await runDocumentMigration(
        migration,
        settings,
        context,
      );

      expect(mutations).toEqual([del(id)]);
    },
  );

  it('keeps the settings while a module still lacks the copied cues', async () => {
    const settings = mockSettings(MOCK_SETTINGS_ID);
    const context = mockMigrationContext([settings, mockNewsletterModule()]);

    const mutations = await runDocumentMigration(migration, settings, context);

    expect(mutations).toEqual([]);
  });
});
