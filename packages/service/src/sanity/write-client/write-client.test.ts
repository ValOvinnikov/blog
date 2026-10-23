import type { TTenantSanityContext } from '@blog/service/sanity/client/client';
import {
  MOCK_ENV_PROJECT_ID,
  MOCK_PLATFORM_PROJECT_ID,
  MOCK_PREVIOUS_TOKEN,
  MOCK_ROTATED_TOKEN,
  MOCK_TENANT_DATASET,
  MOCK_TENANT_PROJECT_ID,
  MOCK_TENANT_TOKEN,
} from '@blog/service/testing/tenant';

const PLATFORM_WRITE_TOKEN = 'write-secret';
const NEXT_SANITY_MODULE = 'next-sanity';

describe('Sanity write client module loading', () => {
  const originalProjectId = process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
  const originalWriteToken = process.env['SANITY_API_WRITE_TOKEN'];

  afterEach(() => {
    if (originalProjectId === undefined) {
      delete process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
    } else {
      process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = originalProjectId;
    }
    if (originalWriteToken === undefined) {
      delete process.env['SANITY_API_WRITE_TOKEN'];
    } else {
      process.env['SANITY_API_WRITE_TOKEN'] = originalWriteToken;
    }
    vi.resetModules();
  });

  it('rejects a call site that omits tenant context at compile time', async () => {
    const { getWriteClient } = await import('./write-client');

    expect(() =>
      // @ts-expect-error -- `getWriteClient` takes a required `TTenantSanityContext`; there is no no-arg form that silently falls back to the platform's project.
      getWriteClient(),
    ).toThrow();
  });

  it('builds the platform write tenant context from env vars', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = MOCK_PLATFORM_PROJECT_ID;
    process.env['SANITY_API_WRITE_TOKEN'] = PLATFORM_WRITE_TOKEN;
    vi.resetModules();

    const { getPlatformSanityWriteContext } = await import('./write-client');

    expect(getPlatformSanityWriteContext()).toMatchObject({
      projectId: MOCK_PLATFORM_PROJECT_ID,
      token: PLATFORM_WRITE_TOKEN,
    });
  });

  it('throws when SANITY_API_WRITE_TOKEN is not set', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = MOCK_ENV_PROJECT_ID;
    delete process.env['SANITY_API_WRITE_TOKEN'];
    vi.resetModules();

    const { getPlatformSanityWriteContext } = await import('./write-client');

    expect(() => getPlatformSanityWriteContext()).toThrow(
      /SANITY_API_WRITE_TOKEN/,
    );
  });

  describe('with a mocked next-sanity', () => {
    let createClientMock: ReturnType<
      typeof vi.fn<(config: Record<string, unknown>) => object>
    >;
    let getWriteClient: (typeof import('./write-client'))['getWriteClient'];

    beforeEach(async () => {
      process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = MOCK_ENV_PROJECT_ID;
      vi.resetModules();
      createClientMock = vi.fn(() => ({}));
      vi.doMock(NEXT_SANITY_MODULE, () => ({ createClient: createClientMock }));

      ({ getWriteClient } = await import('./write-client'));
    });

    afterEach(() => {
      vi.doUnmock(NEXT_SANITY_MODULE);
    });

    it('creates a per-tenant write client scoped to the tenant project/dataset/token', () => {
      getWriteClient({
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: MOCK_TENANT_DATASET,
        token: MOCK_TENANT_TOKEN,
      });

      const [config] = createClientMock.mock.lastCall ?? [];
      const { projectId, dataset, token, useCdn } = config ?? {};

      expect(projectId).toBe(MOCK_TENANT_PROJECT_ID);
      expect(dataset).toBe(MOCK_TENANT_DATASET);
      expect(token).toBe(MOCK_TENANT_TOKEN);
      expect(useCdn).toBe(false);
    });

    it('reuses a cached write client for the same tenant instead of recreating it', () => {
      const tenant = {
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: MOCK_TENANT_DATASET,
        token: MOCK_TENANT_TOKEN,
      };
      const first = getWriteClient(tenant);
      const second = getWriteClient(tenant);

      expect(first).toBe(second);
      expect(createClientMock).toHaveBeenCalledTimes(1);
    });

    it('rebuilds the cached write client when the token of its project changes', () => {
      const first = getWriteClient({
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: MOCK_TENANT_DATASET,
        token: MOCK_PREVIOUS_TOKEN,
      });
      const second = getWriteClient({
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: MOCK_TENANT_DATASET,
        token: MOCK_ROTATED_TOKEN,
      });

      expect(second).not.toBe(first);
      const [rebuiltConfig] = createClientMock.mock.lastCall ?? [];
      const { token: rebuiltToken } = rebuiltConfig ?? {};

      expect(rebuiltToken).toBe(MOCK_ROTATED_TOKEN);
      expect(
        getWriteClient({
          projectId: MOCK_TENANT_PROJECT_ID,
          dataset: MOCK_TENANT_DATASET,
          token: MOCK_ROTATED_TOKEN,
        }),
      ).toBe(second);
      expect(createClientMock).toHaveBeenCalledTimes(2);
    });

    it.each([
      { projectId: '', dataset: MOCK_TENANT_DATASET, token: MOCK_TENANT_TOKEN },
      {
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: '',
        token: MOCK_TENANT_TOKEN,
      },
      {
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: MOCK_TENANT_DATASET,
        token: '',
      },
      {
        projectId: '   ',
        dataset: MOCK_TENANT_DATASET,
        token: MOCK_TENANT_TOKEN,
      },
      {
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: '   ',
        token: MOCK_TENANT_TOKEN,
      },
      {
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: MOCK_TENANT_DATASET,
        token: '   ',
      },
      {
        projectId: undefined,
        dataset: MOCK_TENANT_DATASET,
        token: MOCK_TENANT_TOKEN,
      },
      {
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: undefined,
        token: MOCK_TENANT_TOKEN,
      },
      {
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: MOCK_TENANT_DATASET,
        token: undefined,
      },
      {
        projectId: null,
        dataset: MOCK_TENANT_DATASET,
        token: MOCK_TENANT_TOKEN,
      },
      {
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: null,
        token: MOCK_TENANT_TOKEN,
      },
      {
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: MOCK_TENANT_DATASET,
        token: null,
      },
    ])(
      'throws on the partial tenant context %j, never using the platform client',
      async (tenant) => {
        const { InvalidTenantSanityContextError } =
          await import('./invalid-tenant-sanity-context-error');

        expect(() =>
          getWriteClient(tenant as unknown as TTenantSanityContext),
        ).toThrow(InvalidTenantSanityContextError);
        expect(createClientMock).not.toHaveBeenCalled();
      },
    );
  });
});
