import { BRAND_VARIANT } from '@blog/config';
import { customRenderAsync } from '@web/testing/custom-render';

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

  it('renders the body content, with no accessible name on the section landmark', async () => {
    getContentMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        body: [],
        layout: undefined,
      },
    });

    const { container } = await setup();

    const section = container.querySelector('section');
    expect(section).not.toHaveAttribute('aria-labelledby');
  });
});
