// Barrel for every query/mutation domain in this package. Remaining
// feature domains (comments, ratings) each land with their own owning
// epic's `db` sub-issue, adding a `src/queries/<domain>.ts` file and
// re-exporting it here as its own namespace.
export * as account from './account';
export * as admins from './admins';
export * as bookmarks from './bookmarks';
export * as memberships from './memberships';
export * as siteConfig from './site-config';
export * as subscribers from './subscribers';
export * as tenantDomains from './tenant-domains';
export * as tenants from './tenants';
export * as users from './users';
