import { Database } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

const MIGRATION_STATE_TITLE = 'Migration State';

export const migrationStateSchema = defineType({
  name: 'migrationState',
  title: MIGRATION_STATE_TITLE,
  type: 'document',
  description:
    'Internal record of which content migrations have already run — not edited by hand.',
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
    prepare: () => ({
      title: MIGRATION_STATE_TITLE,
      subtitle: 'System ledger',
    }),
  },
});
