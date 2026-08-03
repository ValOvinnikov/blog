// Barrel for every Drizzle `pgTable` definition in this package.
//
// Empty by design: this bootstrap (#984) stands up the package, the Neon
// connection, and the migration workflow only. The first feature tables
// (Auth.js adapter, comments, ratings, bookmarks, subscribers) each land with
// their own owning epic's `db` sub-issue, adding a `src/schema/<domain>.ts`
// file and re-exporting it here.
export {};
