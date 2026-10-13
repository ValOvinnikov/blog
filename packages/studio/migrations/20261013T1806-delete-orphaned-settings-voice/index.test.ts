import { del } from 'sanity/migrate';

import migration from './index';

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
  _type: 'settings_voice',
};

describe('delete-orphaned-settings-voice migration', () => {
  it.each(['settings-voice', 'drafts.settings-voice'])('deletes %s', (id) => {
    expect(migration.migrate.document({ ...baseDoc, _id: id })).toEqual([
      del(id),
    ]);
  });
});
