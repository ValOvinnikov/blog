import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { service } from '@blog/service';
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
vi.mock('@web/utils/logger/logger');

const tenant = { id: 'tenant-1' } as TTenant;
const credentials = { projectId: 'proj', dataset: 'production', token: 'tok' };
const translationMap = { groups: [], homeLanguages: [] };

const toCredentials = vi.mocked(queries.tenants.toTenantSanityCredentials);
const getTranslationMap = vi.mocked(
  service.global.translationMap.v1.getTranslationMap,
);

describe(getTenantTranslationMap, () => {
  beforeEach(() => {
    toCredentials.mockReset();
    toCredentials.mockReturnValue(credentials as never);
    getTranslationMap.mockReset();
    vi.mocked(logger.error).mockReset();
  });

  it("loads the tenant's map with its own Sanity credentials", async () => {
    getTranslationMap.mockResolvedValue({ ok: true, data: translationMap });

    await expect(getTenantTranslationMap(tenant)).resolves.toBe(translationMap);
    expect(getTranslationMap).toHaveBeenCalledWith(credentials);
  });

  it('is undefined for a tenant without Sanity credentials', async () => {
    toCredentials.mockReturnValue(undefined);

    await expect(getTenantTranslationMap(tenant)).resolves.toBeUndefined();
    expect(getTranslationMap).not.toHaveBeenCalled();
  });

  it('logs and is undefined when the map fails to load', async () => {
    getTranslationMap.mockResolvedValue({
      ok: false,
      error: new Error('down'),
    } as never);

    await expect(getTenantTranslationMap(tenant)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith('translation_map.fetch_failed', {
      error: expect.any(Error),
    });
  });

  it('logs and is undefined when the credentials cannot be decrypted', async () => {
    toCredentials.mockImplementation(() => {
      throw new Error('TENANT_TOKEN_ENCRYPTION_KEY is not configured.');
    });

    await expect(getTenantTranslationMap(tenant)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledOnce();
  });
});
