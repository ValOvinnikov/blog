import { BRAND_VARIANT, type TPortableTextBody } from '@blog/config';
import { customRenderAsync, within } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { ContentModule } from './content-module';

const { getContentMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getContentMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
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
  tenant: 'tenant-1',
});

describe(ContentModule, () => {
  beforeEach(() => {
    getContentMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
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
    expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
  });

  it('renders nothing when the fetch fails', async () => {
    getContentMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a body image against its own image's cdnBaseUrl, not another tenant's", async () => {
    const bodyForTenantA: TPortableTextBody = [
      {
        _type: 'bodyImage',
        _key: 'image-1',
        layout: undefined,
        image: makeSanityImage({
          alt: 'A scenic mountain range',
          cdnBaseUrl: 'https://cdn.sanity.io/images/tenant-a/production/',
        }),
      },
    ];
    const bodyForTenantB: TPortableTextBody = [
      {
        _type: 'bodyImage',
        _key: 'image-1',
        layout: undefined,
        image: makeSanityImage({
          alt: 'A scenic mountain range',
          cdnBaseUrl: 'https://cdn.sanity.io/images/tenant-b/staging/',
        }),
      },
    ];

    getContentMock.mockResolvedValueOnce({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        body: bodyForTenantA,
        layout: undefined,
      },
    });
    const { container: containerA } = await setup();
    const imgA = within(containerA).getByRole('img', {
      name: 'A scenic mountain range',
    });
    expect(imgA.getAttribute('src')).toContain('tenant-a/production');
    expect(imgA.getAttribute('src')).not.toContain('tenant-b/staging');

    getContentMock.mockResolvedValueOnce({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        body: bodyForTenantB,
        layout: undefined,
      },
    });
    const { container: containerB } = await setup();
    const imgB = within(containerB).getByRole('img', {
      name: 'A scenic mountain range',
    });
    expect(imgB.getAttribute('src')).toContain('tenant-b/staging');
    expect(imgB.getAttribute('src')).not.toContain('tenant-a/production');
  });
});
