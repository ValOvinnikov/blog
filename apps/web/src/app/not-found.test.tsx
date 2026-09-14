import NotFound, { generateMetadata } from './not-found';

const {
  standaloneNotFoundPageMock,
  buildNotFoundMetadataMock,
  getRequestTenantIdMock,
} = vi.hoisted(() => ({
  standaloneNotFoundPageMock: vi.fn(),
  buildNotFoundMetadataMock: vi.fn(),
  getRequestTenantIdMock: vi.fn(),
}));

vi.mock('@web/components/pages/standalone-not-found-page', () => ({
  StandaloneNotFoundPage: standaloneNotFoundPageMock,
}));

vi.mock('@web/metadata/not-found-metadata', () => ({
  buildNotFoundMetadata: buildNotFoundMetadataMock,
}));

vi.mock('@web/server/tenant/get-request-tenant-id', () => ({
  getRequestTenantId: getRequestTenantIdMock,
}));

describe('NotFound (root not-found route)', () => {
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

  it('renders StandaloneNotFoundPage with the tenant resolved from the request header', async () => {
    const ui = { type: 'div', props: {} };
    getRequestTenantIdMock.mockResolvedValue('tenant-1');
    standaloneNotFoundPageMock.mockResolvedValue(ui);

    await expect(NotFound()).resolves.toBe(ui);
    expect(standaloneNotFoundPageMock).toHaveBeenCalledWith({
      tenant: 'tenant-1',
    });
  });
});
