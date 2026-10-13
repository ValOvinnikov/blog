import { del } from 'sanity/migrate';

import migration from './index';

const baseDoc = {
  _type: 'settings_theme',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

describe('retire-settings-theme migration', () => {
  it.each([
    'provisioning.settings.theme',
    'drafts.provisioning.settings.theme',
    'settings-theme',
  ])('deletes %s', async (id) => {
    expect(await migration.migrate.document({ ...baseDoc, _id: id })).toEqual([
      del(id),
    ]);
  });
});
