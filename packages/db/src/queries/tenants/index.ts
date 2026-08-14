// Barrel for the tenants query domain — one folder per query, re-exported
// here as the `tenants` namespace (see ../index.ts).
export * from './create-tenant';
export * from './get-tenant-by-slug';
export * from './get-tenant-sanity-credentials';
export * from './list-tenants';
export * from './list-tenants-by-ids';
export * from './set-tenant-sanity-token';
