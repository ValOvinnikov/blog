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

const { loggerErrorMock } = vi.hoisted(() => ({
  loggerErrorMock: vi.fn(),
}));

vi.mock('@web/utils/logger/logger', () => ({
  logger: {
    error: loggerErrorMock,
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const tenant = {
  projectId: 'tenant-a-project',
  dataset: 'production',
  token: 'tok',
};

const input = {
  type: 'page_topic',
  id: 'topic-1',
  tenantId: 'tenant-uuid-1',
  tenant,
};

describe(resolveReferencingModuleTags, () => {
  beforeEach(() => {
    getReferencingModuleIdsMock.mockReset();
    loggerErrorMock.mockReset();
  });

  it('maps every resolved module id onto its per-document purge tag', async () => {
    getReferencingModuleIdsMock.mockResolvedValue({
      ok: true,
      data: ['hero-1', 'cta-2'],
    });

    const result = await resolveReferencingModuleTags(input);

    expect(result).toEqual(['module:hero-1', 'module:cta-2']);
  });

  it('returns no tags when nothing references the document', async () => {
    getReferencingModuleIdsMock.mockResolvedValue({ ok: true, data: [] });

    const result = await resolveReferencingModuleTags(input);

    expect(result).toEqual([]);
  });

  it('looks the document up by its own id in the tenant context', async () => {
    getReferencingModuleIdsMock.mockResolvedValue({ ok: true, data: [] });

    await resolveReferencingModuleTags(input);

    expect(getReferencingModuleIdsMock).toHaveBeenCalledWith('topic-1', tenant);
  });

  it('degrades to no tags when the lookup fails, leaving the caller free to purge the rest', async () => {
    getReferencingModuleIdsMock.mockResolvedValue({
      ok: false,
      error: new Error('sanity unreachable'),
    });

    const result = await resolveReferencingModuleTags(input);

    expect(result).toEqual([]);
  });

  it('logs a failed lookup once, with the document and tenant context attached', async () => {
    const error = new Error('sanity unreachable');
    getReferencingModuleIdsMock.mockResolvedValue({ ok: false, error });

    await resolveReferencingModuleTags(input);

    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'revalidate.referencing_modules_lookup_failed',
      expect.objectContaining({
        type: 'page_topic',
        id: 'topic-1',
        tenantId: 'tenant-uuid-1',
        error,
      }),
    );
  });
});
