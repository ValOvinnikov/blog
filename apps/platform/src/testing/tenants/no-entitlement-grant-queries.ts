export const noEntitlementGrantQueries = () => ({
  tenantEntitlementGrants: {
    listResolvableEntitlementGrants: vi.fn(async () => []),
  },
});
