// Barrel for every Drizzle `pgTable` definition in this package.
//
// Remaining feature tables (comments, ratings, bookmarks, subscribers) each
// land with their own owning epic's `db` sub-issue, adding a
// `src/schema/<domain>.ts` file and re-exporting it here.
export * from './auth';
