import { del, type MigrationContext } from 'sanity/migrate';

import migration, { findModulesMissingCopiedCues } from './index';

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

const copiedCue = { _key: 'trust-cue-1', _type: 'newsletterTrustCue' };

const createContext = (result: unknown): MigrationContext =>
  ({ client: { fetch: async () => result } }) as unknown as MigrationContext;

describe(findModulesMissingCopiedCues, () => {
  it('reports a module without cues while the settings still carry some', () => {
    expect(
      findModulesMissingCopiedCues({
        settingsTrustCues: ['No spam'],
        modules: [
          { _id: 'newsletter-1', trustCues: [copiedCue] },
          { _id: 'newsletter-2' },
        ],
      }),
    ).toEqual(['newsletter-2']);
  });

  it.each([
    ['no settings cues', null],
    ['only blank settings cues', ['', ' ']],
  ])(
    'reports nothing when there are %s to lose',
    (_label, settingsTrustCues) => {
      expect(
        findModulesMissingCopiedCues({
          settingsTrustCues,
          modules: [{ _id: 'newsletter-1' }],
        }),
      ).toEqual([]);
    },
  );
});

describe('retire-newsletter-settings migration', () => {
  it.each(['settings-newsletter', 'drafts.settings-newsletter'])(
    'deletes %s once every module carries the copied cues',
    async (id) => {
      const doc = { ...baseDoc, _id: id, _type: 'settings_newsletter' };
      const context = createContext({
        settingsTrustCues: ['No spam'],
        modules: [{ _id: 'newsletter-1', trustCues: [copiedCue] }],
      });

      expect(await migration.migrate.document(doc, context)).toEqual([del(id)]);
    },
  );

  it('rejects, aborting the run, while a module still lacks the copied cues', async () => {
    const doc = {
      ...baseDoc,
      _id: 'settings-newsletter',
      _type: 'settings_newsletter',
    };
    const context = createContext({
      settingsTrustCues: ['No spam'],
      modules: [{ _id: 'newsletter-1' }],
    });

    await expect(migration.migrate.document(doc, context)).rejects.toThrow(
      /newsletter-1/,
    );
  });
});
