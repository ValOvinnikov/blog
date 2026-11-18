export const noEntitlementGrantQueries = () => ({
  tenantEntitlementGrants: {
    listResolvableEntitlementGrants: vi.fn(async () => []),
    listEntitlementGrants: vi.fn(async () => []),
  },
});
