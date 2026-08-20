import { delete_ } from 'sanity/migrate';

import migration from './index';

describe('delete-legacy-blog-category migration', () => {
  it('deletes a blog_category document', () => {
    const category = {
      _id: 'abc123',
      _type: 'blog_category',
      _createdAt: '2026-01-01T00:00:00Z',
      _updatedAt: '2026-01-01T00:00:00Z',
      _rev: 'rev-1',
    };

    expect(migration.migrate.document(category)).toEqual(delete_(category._id));
  });
});
