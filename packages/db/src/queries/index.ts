// Barrel for every query/mutation domain in this package. Remaining
// feature domains (comments, ratings, subscribers) each land with their own
// owning epic's `db` sub-issue, adding a `src/queries/<domain>.ts` file and
// re-exporting it here as its own namespace.
export * as bookmarks from './bookmarks';
