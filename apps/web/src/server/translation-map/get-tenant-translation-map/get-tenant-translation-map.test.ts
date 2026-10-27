import { LOCALE_ISO_CODES } from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_STATUS } from '@blog/db/constants';
import { service, type TTranslationMap } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { TRANSLATION_MAP_FETCH_FAILED_EVENT } from '@web/constants/translation-map';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_SANITY_CONTEXT,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getTenantTranslationMap } from './get-tenant-translation-map';

vi.mock('@blog/db', () => ({
  queries: { tenants: { toTenantSanityCredentials: vi.fn() } },
}));
vi.mock('@blog/service', () => ({
  service: {
    global: { translationMap: { v1: { getTranslationMap: vi.fn() } } },
  },
}));

const MOCK_CREDENTIALS = {
  ...MOCK_TENANT_SANITY_CONTEXT,
  defaultLocale: LOCALE_ISO_CODES.EN,
  status: TENANT_STATUS.ACTIVE,
  deprovisionedAt: null,
  provisioningStatus: null,
};

const MOCK_TRANSLATION_MAP: TTranslationMap = {
  groups: [],
  homeLanguages: [],
  postIndexLanguages: [],
  topicIndexLanguages: [],
  tagIndexLanguages: [],
};

const toCredentials = vi.mocked(queries.tenants.toTenantSanityCredentials);
const getTranslationMap = vi.mocked(
  service.global.translationMap.v1.getTranslationMap,
);
const loggerErrorMock = vi.mocked(logger.error);

describe(getTenantTranslationMap, () => {
  const tenant = mockTenant();

  beforeEach(() => {
    toCredentials.mockReset();
    toCredentials.mockReturnValue(MOCK_CREDENTIALS);
    getTranslationMap.mockReset();
  });

  it("loads the tenant's map with its own Sanity credentials", async () => {
    getTranslationMap.mockResolvedValueOnce(okResult(MOCK_TRANSLATION_MAP));

    const result = await getTenantTranslationMap(tenant);

    expect(result).toBe(MOCK_TRANSLATION_MAP);
    expect(getTranslationMap).toHaveBeenCalledWith(MOCK_CREDENTIALS);
  });

  it('is undefined for a tenant without Sanity credentials', async () => {
    toCredentials.mockReturnValueOnce(undefined);

    const result = await getTenantTranslationMap(tenant);

    expect(result).toBeUndefined();
    expect(getTranslationMap).not.toHaveBeenCalled();
  });

  it('logs and is undefined when the map fails to load', async () => {
    getTranslationMap.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    const result = await getTenantTranslationMap(tenant);

    expect(result).toBeUndefined();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      TRANSLATION_MAP_FETCH_FAILED_EVENT,
      { error: MOCK_ERROR },
    );
  });

  it('logs and is undefined when the credentials cannot be decrypted', async () => {
    toCredentials.mockImplementationOnce(() => {
      throw MOCK_ERROR;
    });

    const result = await getTenantTranslationMap(tenant);

    expect(result).toBeUndefined();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      TRANSLATION_MAP_FETCH_FAILED_EVENT,
      { error: MOCK_ERROR },
    );
  });
});
