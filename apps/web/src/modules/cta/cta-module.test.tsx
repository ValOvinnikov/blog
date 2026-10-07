import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync } from '@web/testing/custom-render';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { CtaModule } from './cta-module';

const { getCtaMock } = vi.hoisted(() => ({
  getCtaMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      cta: { v1: { getCta: getCtaMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const getRequestContextMock = vi.mocked(getRequestContext);

const setup = customRenderAsync(CtaModule, {
  id: 'cta-1',
});

describe(`<${CtaModule.name}/>`, () => {
  beforeEach(() => {
    getCtaMock.mockReset();
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    getCtaMock.mockResolvedValue({ ok: false, error: new Error('boom') });
  });

  it('renders nothing when the fetch fails', async () => {
    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('forwards the resolved tenant Sanity context to getCta', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      sanityContext: tenant,
    });

    await setup();

    expect(getCtaMock).toHaveBeenCalledWith('cta-1', tenant);
  });
});
