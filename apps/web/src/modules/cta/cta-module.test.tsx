import { customRenderAsync } from '@web/testing/custom-render';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { CtaModule } from './cta-module';

const { getCtaMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getCtaMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      cta: { v1: { getCta: getCtaMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

const setup = customRenderAsync(CtaModule, {
  id: 'cta-1',
  locale: 'en',
  tenant: 'tenant-1',
});

describe(CtaModule, () => {
  beforeEach(() => {
    getCtaMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
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
    expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
  });
});
