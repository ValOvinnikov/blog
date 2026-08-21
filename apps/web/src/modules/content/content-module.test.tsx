import { BRAND_VARIANT, type RichText } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import { ContentModule } from './content-module';

const { getContentMock } = vi.hoisted(() => ({
  getContentMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  getSanityImageBaseUrl: () =>
    'https://cdn.sanity.io/images/test-project/test-dataset/',
  service: {
    modules: {
      content: { v1: { getContent: getContentMock } },
    },
  },
}));

const setup = customRenderAsync(ContentModule, {
  id: 'content-1',
  locale: 'en',
});

describe(ContentModule, () => {
  beforeEach(() => {
    getContentMock.mockReset();
  });

  it('renders nothing when the fetch fails', async () => {
    getContentMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it("resolves baseUrl via getSanityImageBaseUrl and forwards it into a rendered body image's src", async () => {
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
    expect(img.getAttribute('src')).toContain('test-project/test-dataset');
  });
});
