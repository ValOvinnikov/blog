import { errorResult, okResult } from '@blog/utils';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { resolveReferencingModuleTags } from './resolve-referencing-module-tags';

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

const input = {
  type: 'page_topic',
  id: 'topic-1',
  tenantId: MOCK_TENANT_ID,
  tenant: MOCK_TENANT_SANITY_CONTEXT,
};

describe(resolveReferencingModuleTags, () => {
  beforeEach(() => {
    getReferencingModuleIdsMock.mockReset();
    loggerErrorMock.mockReset();
    getReferencingModuleIdsMock.mockResolvedValue(okResult([]));
  });

  it('maps every resolved module id onto its per-document purge tag', async () => {
    getReferencingModuleIdsMock.mockResolvedValue(
      okResult(['hero-1', 'cta-2']),
    );

    const result = await resolveReferencingModuleTags(input);

    expect(result).toEqual(['module:hero-1', 'module:cta-2']);
  });

  it('returns no tags when nothing references the document', async () => {
    const result = await resolveReferencingModuleTags(input);

    expect(result).toEqual([]);
  });

  it('looks the document up by its own id in the tenant context', async () => {
    await resolveReferencingModuleTags(input);

    expect(getReferencingModuleIdsMock).toHaveBeenCalledWith(
      input.id,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('degrades to no tags and logs once when the lookup fails', async () => {
    getReferencingModuleIdsMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const result = await resolveReferencingModuleTags(input);

    expect(result).toEqual([]);
    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      REVALIDATE_LOG.REFERENCING_MODULES_LOOKUP_FAILED,
      {
        type: input.type,
        id: input.id,
        tenantId: MOCK_TENANT_ID,
        error: MOCK_ERROR,
      },
    );
  });
});
