export const getSiteConfigMock = vi.fn();
export const selectLiveLocalesMock = vi.fn();

export const mockLookPageDb = async () => ({
  ...(await (
    await import('@platform/testing/mock-db-constants')
  ).mockDbConstants()),
  queries: {
    siteConfig: { getSiteConfig: getSiteConfigMock },
    tenants: { selectLiveLocalesWithin: selectLiveLocalesMock },
  },
});
