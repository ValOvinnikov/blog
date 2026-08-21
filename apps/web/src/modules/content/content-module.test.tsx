import { customRenderAsync } from '@web/testing/custom-render';

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
});
