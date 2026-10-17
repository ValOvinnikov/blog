import { z } from 'zod';

import { fetchGitHubJson, type TGitHubResult } from './fetch-github';

const DB_MIGRATION_JOURNAL_PATH = 'packages/db/migrations/meta/_journal.json';

const contentSchema = z.object({ content: z.string() });

const journalSchema = z.object({
  entries: z.array(z.object({ tag: z.string(), when: z.number() })),
});

export type TDbMigrationJournalEntry = z.infer<
  typeof journalSchema
>['entries'][number];

export const getDbMigrationJournal = (
  ref: string,
): Promise<TGitHubResult<TDbMigrationJournalEntry[]>> =>
  fetchGitHubJson(
    `/contents/${DB_MIGRATION_JOURNAL_PATH}?ref=${encodeURIComponent(ref)}`,
    (body) => {
      const { content } = contentSchema.parse(body);
      const journal: unknown = JSON.parse(
        Buffer.from(content, 'base64').toString('utf-8'),
      );

      return journalSchema.parse(journal).entries;
    },
  );
