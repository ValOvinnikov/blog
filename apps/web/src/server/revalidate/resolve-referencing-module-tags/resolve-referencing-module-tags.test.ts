import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { resolveReferencingModuleTags } from './resolve-referencing-module-tags';

faker.seed(5722);

const { getReferencingModuleIdsMock } = vi.hoisted(() => ({
  getReferencingModuleIdsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      modules: { v1: { getReferencingModuleIds: getReferencingModuleIdsMock } },
    },
  },
}));

const loggerErrorMock = vi.mocked(logger.error);

const MOCK_INPUT = {
  type: 'page_topic',
  id: faker.string.uuid(),
  tenantId: MOCK_TENANT_ID,
  tenant: MOCK_TENANT_SANITY_CONTEXT,
};
const MOCK_HERO_MODULE_ID = faker.string.uuid();
const MOCK_CTA_MODULE_ID = faker.string.uuid();

describe(resolveReferencingModuleTags, () => {
  beforeEach(() => {
    getReferencingModuleIdsMock.mockReset();
    getReferencingModuleIdsMock.mockResolvedValue(okResult([]));
  });

  it('maps every resolved module id onto its per-document purge tag', async () => {
    getReferencingModuleIdsMock.mockResolvedValue(
      okResult([MOCK_HERO_MODULE_ID, MOCK_CTA_MODULE_ID]),
    );

    const result = await resolveReferencingModuleTags(MOCK_INPUT);

    expect(result).toEqual([
      `module:${MOCK_HERO_MODULE_ID}`,
      `module:${MOCK_CTA_MODULE_ID}`,
    ]);
  });

  it('returns no tags when nothing references the document', async () => {
    const result = await resolveReferencingModuleTags(MOCK_INPUT);

    expect(result).toEqual([]);
  });

  it('looks the document up by its own id in the tenant context', async () => {
    await resolveReferencingModuleTags(MOCK_INPUT);

    expect(getReferencingModuleIdsMock).toHaveBeenCalledWith(
      MOCK_INPUT.id,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('degrades to no tags and logs once when the lookup fails', async () => {
    getReferencingModuleIdsMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const result = await resolveReferencingModuleTags(MOCK_INPUT);

    expect(result).toEqual([]);
    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      REVALIDATE_LOG.REFERENCING_MODULES_LOOKUP_FAILED,
      {
        type: MOCK_INPUT.type,
        id: MOCK_INPUT.id,
        tenantId: MOCK_TENANT_ID,
        error: MOCK_ERROR,
      },
    );
  });
});
