import { delete_ } from 'sanity/migrate';

import migration from './index';

describe('delete-legacy-module-post-list migration', () => {
  it('deletes a module_postList document', () => {
    const postList = {
      _id: 'abc123',
      _type: 'module_postList',
      _createdAt: '2026-01-01T00:00:00Z',
      _updatedAt: '2026-01-01T00:00:00Z',
      _rev: 'rev-1',
    };

    expect(migration.migrate.document(postList)).toEqual(delete_(postList._id));
  });
});
