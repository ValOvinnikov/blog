import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { LOCALE_ISO_CODES } from '@shinefold/config';

export const getSiteConfigMock = vi.fn();
export const selectLiveLocalesMock = vi.fn();

export const mockLookPageDb = async () => ({
  ...(await mockDbConstants()),
  queries: {
    siteConfig: { getSiteConfig: getSiteConfigMock },
    tenants: { selectLiveLocalesWithin: selectLiveLocalesMock },
  },
});

export const arrangeLookPageQueries = () => {
  getSiteConfigMock.mockResolvedValue(undefined);
  selectLiveLocalesMock.mockReturnValue([LOCALE_ISO_CODES.EN]);
};
