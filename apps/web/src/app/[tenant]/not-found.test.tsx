import TenantNotFound, { generateMetadata } from './not-found';

const {
  standaloneNotFoundPageMock,
  buildNotFoundMetadataMock,
  getRememberedTenantIdMock,
  headersMock,
} = vi.hoisted(() => ({
  standaloneNotFoundPageMock: vi.fn(),
  buildNotFoundMetadataMock: vi.fn(),
  getRememberedTenantIdMock: vi.fn(),
  headersMock: vi.fn(),
}));

vi.mock('@web/components/pages/standalone-not-found-page', () => ({
  StandaloneNotFoundPage: standaloneNotFoundPageMock,
}));

vi.mock('@web/metadata/not-found-metadata', () => ({
  buildNotFoundMetadata: buildNotFoundMetadataMock,
}));

vi.mock('@web/server/tenant/remembered-tenant', () => ({
  getRememberedTenantId: getRememberedTenantIdMock,
}));

vi.mock('next/headers', () => ({ headers: headersMock }));

describe('TenantNotFound ([tenant] not-found route)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMetadata', () => {
    it('delegates to buildNotFoundMetadata', async () => {
      const metadata = { title: 'Page not found' };
      buildNotFoundMetadataMock.mockResolvedValue(metadata);

      await expect(generateMetadata()).resolves.toBe(metadata);
    });
  });

  it('renders StandaloneNotFoundPage with the tenant remembered by the layout', async () => {
    const ui = { type: 'div', props: {} };
    getRememberedTenantIdMock.mockReturnValue('tenant-1');
    standaloneNotFoundPageMock.mockResolvedValue(ui);

    await expect(TenantNotFound()).resolves.toBe(ui);
    expect(standaloneNotFoundPageMock).toHaveBeenCalledWith({
      tenant: 'tenant-1',
    });
    expect(headersMock).not.toHaveBeenCalled();
  });

  it('renders StandaloneNotFoundPage with no tenant when the layout never remembered one, without reading headers', async () => {
    const ui = { type: 'div', props: {} };
    getRememberedTenantIdMock.mockReturnValue(undefined);
    standaloneNotFoundPageMock.mockResolvedValue(ui);

    await expect(TenantNotFound()).resolves.toBe(ui);
    expect(standaloneNotFoundPageMock).toHaveBeenCalledWith({
      tenant: undefined,
    });
    expect(headersMock).not.toHaveBeenCalled();
  });

  describe('given the layout seeded the unresolved-tenant placeholder', () => {
    afterEach(() => {
      vi.doUnmock('react');
      vi.doUnmock('@web/server/tenant/remembered-tenant');
      vi.resetModules();
    });

    it('renders the defaults path — the placeholder never reaches StandaloneNotFoundPage as a tenant id', async () => {
      vi.doMock('react', async (importOriginal) => {
        const actual = await importOriginal<typeof import('react')>();
        return {
          ...actual,
          cache: (fn: () => unknown) => {
            let called = false;
            let result: unknown;
            return () => {
              if (!called) {
                result = fn();
                called = true;
              }
              return result;
            };
          },
        };
      });
      vi.doUnmock('@web/server/tenant/remembered-tenant');
      vi.resetModules();

      const { rememberRequestTenantId } =
        await import('@web/server/tenant/remembered-tenant');
      const { UNRESOLVED_TENANT_PLACEHOLDER } =
        await import('@web/server/tenant/unresolved-tenant-placeholder');
      const { default: FreshTenantNotFound } = await import('./not-found');

      const ui = { type: 'div', props: {} };
      standaloneNotFoundPageMock.mockResolvedValue(ui);

      rememberRequestTenantId(UNRESOLVED_TENANT_PLACEHOLDER);

      await expect(FreshTenantNotFound()).resolves.toBe(ui);
      expect(standaloneNotFoundPageMock).toHaveBeenCalledWith({
        tenant: undefined,
      });
      expect(headersMock).not.toHaveBeenCalled();
    });
  });
});
