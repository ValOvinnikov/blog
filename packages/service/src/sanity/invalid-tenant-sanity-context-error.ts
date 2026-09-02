/**
 * A `TTenantSanityContext` missing `projectId`, `dataset`, or `token` is
 * refused rather than silently falling back to the platform project — an
 * accidental cross-tenant write must be impossible, not merely unlikely.
 */
export class InvalidTenantSanityContextError extends Error {
  readonly code = 'INVALID_TENANT_SANITY_CONTEXT' as const;

  constructor() {
    super(
      'getWriteClient: tenant context is missing a required projectId, dataset, or token',
    );
  }
}
