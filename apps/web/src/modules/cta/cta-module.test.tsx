import { customRenderAsync } from '@web/testing/custom-render';

import { CtaModule } from './cta-module';

const { getCtaMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getCtaMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  getSanityImageBaseUrl: () =>
    'https://cdn.sanity.io/images/test-project/test-dataset/',
  service: {
    modules: {
      cta: { v1: { getCta: getCtaMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

const setup = customRenderAsync(CtaModule, { id: 'cta-1', locale: 'en' });

describe(CtaModule, () => {
  beforeEach(() => {
    getCtaMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(undefined);
  });

  it('renders nothing when the fetch fails', async () => {
    getCtaMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('forwards the resolved tenant Sanity context to getCta', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getCtaMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    await setup();

    expect(getCtaMock).toHaveBeenCalledWith('cta-1', tenant);
  });
});
