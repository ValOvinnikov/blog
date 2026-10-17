import type { TChangedFile } from '@platform/server/github/compare-commits';
import type { TDbMigrationJournalEntry } from '@platform/server/github/get-db-migration-journal';

const CONTENT_MIGRATION_ENTRY =
  /^packages\/studio\/migrations\/(\d{8}T\d{4}-[^/]+)\/index\.ts$/;
const DB_MIGRATION_FILE = /^packages\/db\/migrations\/([^/]+)\.sql$/;

const addedMatches = (files: TChangedFile[], pattern: RegExp): string[] =>
  files.flatMap(({ filename, status }) => {
    const match = status === 'added' ? pattern.exec(filename) : null;
    return match?.[1] ? [match[1]] : [];
  });

export const countAddedContentMigrations = (files: TChangedFile[]): number =>
  addedMatches(files, CONTENT_MIGRATION_ENTRY).length;

export const listAddedDbMigrationTags = (files: TChangedFile[]): string[] =>
  addedMatches(files, DB_MIGRATION_FILE);

export const countPendingDbMigrations = (
  addedTags: string[],
  journal: TDbMigrationJournalEntry[],
  appliedTimestamps: number[],
): number => {
  const applied = new Set(appliedTimestamps);
  const whenByTag = new Map(journal.map(({ tag, when }) => [tag, when]));

  return addedTags.filter((tag) => {
    const when = whenByTag.get(tag);
    return when === undefined || !applied.has(when);
  }).length;
};
