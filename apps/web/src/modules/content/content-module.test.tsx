import { BRAND_VARIANT } from '@blog/config';
import type { TPortableTextBody } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, within } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { ContentModule } from './content-module';

const { getContentMock } = vi.hoisted(() => ({
  getContentMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      content: { v1: { getContent: getContentMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const getRequestContextMock = vi.mocked(getRequestContext);

const setup = customRenderAsync(ContentModule, {
  id: 'content-1',
});

describe(`<${ContentModule.name}/>`, () => {
  beforeEach(() => {
    getContentMock.mockReset();
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it('forwards the resolved tenant Sanity context to getContent', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      sanityContext: tenant,
    });
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

  it('renders a body image resolving through the Sanity CDN', async () => {
    const body: TPortableTextBody = [
      {
        _type: 'bodyImage',
        _key: 'image-1',
        layout: undefined,
        image: makeSanityImage({ alt: 'A scenic mountain range' }),
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
    const { container } = await setup();
    const img = within(container).getByRole('img', {
      name: 'A scenic mountain range',
    });
    expect(img.getAttribute('src')).toContain('cdn.sanity.io');
  });
});
