import type { TTenantSanityContext } from '@blog/service/sanity/client/client';
import {
  MOCK_PLATFORM_PROJECT_ID,
  MOCK_PREVIOUS_TOKEN,
  MOCK_ROTATED_TOKEN,
  MOCK_TENANT_DATASET,
  MOCK_TENANT_PROJECT_ID,
  MOCK_TENANT_TOKEN,
  mockTenant,
} from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import type { InvalidTenantSanityContextError } from './invalid-tenant-sanity-context-error';
import { getPlatformSanityWriteContext, getWriteClient } from './write-client';

faker.seed(6016);

const MOCK_PLATFORM_WRITE_TOKEN = faker.string.alphanumeric(32);
const NEXT_SANITY_MODULE = 'next-sanity';
const BLANK = '   ';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe(getPlatformSanityWriteContext, () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', MOCK_PLATFORM_PROJECT_ID);
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', MOCK_TENANT_DATASET);
  });

  it('builds the platform write tenant context from env vars', async () => {
    vi.stubEnv('SANITY_API_WRITE_TOKEN', MOCK_PLATFORM_WRITE_TOKEN);
    vi.resetModules();

    const { getPlatformSanityWriteContext: freshGetContext } =
      await import('./write-client');

    expect(freshGetContext()).toEqual({
      projectId: MOCK_PLATFORM_PROJECT_ID,
      dataset: MOCK_TENANT_DATASET,
      token: MOCK_PLATFORM_WRITE_TOKEN,
    });
  });

  it('throws when SANITY_API_WRITE_TOKEN is not set', async () => {
    vi.stubEnv('SANITY_API_WRITE_TOKEN', undefined);
    vi.resetModules();

    const { getPlatformSanityWriteContext: freshGetContext } =
      await import('./write-client');

    expect(() => freshGetContext()).toThrow(/SANITY_API_WRITE_TOKEN/);
  });
});

describe(getWriteClient, () => {
  it('rejects a call site that omits tenant context at compile time', () => {
    expect(() =>
      // @ts-expect-error -- `getWriteClient` takes a required `TTenantSanityContext`; there is no no-arg form that silently falls back to the platform's project.
      getWriteClient(),
    ).toThrow();
  });

  describe('with a faked next-sanity', () => {
    let createClientMock: ReturnType<
      typeof vi.fn<(config: Record<string, unknown>) => object>
    >;
    let freshGetWriteClient: typeof getWriteClient;
    let FreshInvalidContextError: typeof InvalidTenantSanityContextError;

    beforeEach(async () => {
      vi.resetModules();
      createClientMock = vi.fn(() => ({}));
      vi.doMock(NEXT_SANITY_MODULE, () => ({ createClient: createClientMock }));

      ({ getWriteClient: freshGetWriteClient } =
        await import('./write-client'));
      ({ InvalidTenantSanityContextError: FreshInvalidContextError } =
        await import('./invalid-tenant-sanity-context-error'));
    });

    afterEach(() => {
      vi.doUnmock(NEXT_SANITY_MODULE);
    });

    it('creates a write client scoped to the tenant with the CDN disabled', () => {
      freshGetWriteClient(mockTenant());

      const [config] = createClientMock.mock.lastCall ?? [];
      const { projectId, dataset, token, useCdn } = config ?? {};

      expect(projectId).toBe(MOCK_TENANT_PROJECT_ID);
      expect(dataset).toBe(MOCK_TENANT_DATASET);
      expect(token).toBe(MOCK_TENANT_TOKEN);
      expect(useCdn).toBe(false);
    });

    it('reuses the cached write client for a repeated tenant', () => {
      const first = freshGetWriteClient(mockTenant());
      const second = freshGetWriteClient(mockTenant());

      expect(second).toBe(first);
      expect(createClientMock).toHaveBeenCalledTimes(1);
    });

    it('rebuilds the cached write client once the tenant token rotates', () => {
      const previous = freshGetWriteClient(
        mockTenant({ token: MOCK_PREVIOUS_TOKEN }),
      );
      const rotated = freshGetWriteClient(
        mockTenant({ token: MOCK_ROTATED_TOKEN }),
      );
      const reused = freshGetWriteClient(
        mockTenant({ token: MOCK_ROTATED_TOKEN }),
      );

      const [rebuiltConfig] = createClientMock.mock.lastCall ?? [];
      const { token: rebuiltToken } = rebuiltConfig ?? {};

      expect(rotated).not.toBe(previous);
      expect(reused).toBe(rotated);
      expect(rebuiltToken).toBe(MOCK_ROTATED_TOKEN);
      expect(createClientMock).toHaveBeenCalledTimes(2);
    });

    it.each(
      (['projectId', 'dataset', 'token'] as const).flatMap((field) =>
        ['', BLANK, undefined, null].map((value) => ({ field, value })),
      ),
    )(
      'throws without creating a client when $field is $value',
      ({ field, value }) => {
        const tenant = { ...mockTenant(), [field]: value };

        expect(() =>
          freshGetWriteClient(tenant as unknown as TTenantSanityContext),
        ).toThrow(FreshInvalidContextError);
        expect(createClientMock).not.toHaveBeenCalled();
      },
    );
  });
});
