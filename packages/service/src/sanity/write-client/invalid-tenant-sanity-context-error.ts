/** Refused instead of falling back to the platform project, so a cross-tenant write is impossible rather than unlikely. */
export class InvalidTenantSanityContextError extends Error {
  readonly code = 'INVALID_TENANT_SANITY_CONTEXT' as const;

  constructor() {
    super(
      'getWriteClient: tenant context is missing a required projectId, dataset, or token',
    );
  }
}
