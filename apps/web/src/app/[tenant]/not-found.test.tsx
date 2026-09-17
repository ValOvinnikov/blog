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
});
