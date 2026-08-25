import { Database } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Declares the shape of the migration tooling's own operational ledger
 * (`scripts/migrate-lib.mjs` / `scripts/migrate.mjs`, `_id: 'migrationState'`)
 * so `sanity documents validate` recognizes the type — it is not authorable
 * content. `sanity.config.ts`'s `document.actions`/`newDocumentOptions`
 * resolvers keep it out of Studio editing and the "+ create" menu; omnisearch
 * visibility is off separately, hiding it from global ⌘K search too.
 */
export const migrationStateSchema = defineType({
  name: 'migrationState',
  title: 'Migration State',
  type: 'document',
  icon: Database,
  __experimental_omnisearch_visibility: false,
  fields: [
    defineField({
      name: 'applied',
      title: 'Applied migrations',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'appliedMigration',
          fields: [
            defineField({ name: 'id', type: 'string' }),
            defineField({ name: 'runAt', type: 'datetime' }),
            defineField({ name: 'sha', type: 'string' }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Migration State', subtitle: 'System ledger' }),
  },
});
