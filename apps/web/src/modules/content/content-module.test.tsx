import { BRAND_VARIANT, type RichText } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import { ContentModule } from './content-module';

const { getContentMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getContentMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  getSanityImageBaseUrl: (tenant: { projectId: string; dataset: string }) =>
    `https://cdn.sanity.io/images/${tenant.projectId}/${tenant.dataset}/`,
  service: {
    modules: {
      content: { v1: { getContent: getContentMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

const setup = customRenderAsync(ContentModule, {
  id: 'content-1',
  locale: 'en',
});

describe(ContentModule, () => {
  beforeEach(() => {
    getContentMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(undefined);
  });

  it('forwards the resolved tenant Sanity context to getContent', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getContentMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        body: [],
        layout: undefined,
      },
    });

    await setup();

    expect(getContentMock).toHaveBeenCalledWith('content-1', tenant);
  });

  it('renders nothing when the fetch fails', async () => {
    getContentMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it("resolves baseUrl via getSanityImageBaseUrl and forwards it into a rendered body image's src", async () => {
    getTenantSanityContextMock.mockResolvedValue({
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    });
    const body: RichText = [
      {
        _type: 'bodyImage',
        _key: 'image-1',
        asset: {
          _ref: 'image-abc123-800x600-jpg',
          _type: 'reference',
        },
        alt: 'A scenic mountain range',
      },
    ];
    getContentMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        body,
        layout: undefined,
      },
    });

    await setup();

    const img = screen.getByRole('img', { name: 'A scenic mountain range' });
    expect(img.getAttribute('src')).toContain('tenant-project/production');
  });
});
