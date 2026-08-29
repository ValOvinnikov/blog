import { defineMigration, delete_ } from 'sanity/migrate';

/**
 * Run only after the create-and-repoint migration has completed against the
 * same dataset — a document with incoming strong references cannot be
 * deleted, so this fails loudly rather than silently orphaning anything.
 */
export default defineMigration({
  title: 'Delete legacy blog_category documents',
  documentTypes: ['blog_category'],

  migrate: {
    document(doc) {
      return delete_(doc._id);
    },
  },
});
