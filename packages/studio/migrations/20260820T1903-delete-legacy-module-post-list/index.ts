import { defineMigration, delete_ } from 'sanity/migrate';

/**
 * Run only after create-module-post-latest-from-post-list has completed
 * against the same dataset — a document with incoming strong references
 * cannot be deleted, so this fails loudly rather than silently orphaning
 * anything.
 */
export default defineMigration({
  title: 'Delete legacy module_postList documents',
  documentTypes: ['module_postList'],

  migrate: {
    document(doc) {
      return delete_(doc._id);
    },
  },
});
