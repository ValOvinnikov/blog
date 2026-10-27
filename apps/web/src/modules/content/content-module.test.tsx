import { BRAND_VARIANT, PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config';
import type { TPortableTextBody } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { MOCK_CONTENT_MODULE_ID } from '@web/testing/modules/content/fixtures';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { SANITY_CDN_HOST } from '@web/testing/shared/sanity-image/constants';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { ContentModule } from './content-module';

faker.seed(6011);

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

const MOCK_IMAGE_ALT = faker.lorem.words(3);

const setup = customRenderAsync(ContentModule, {
  id: MOCK_CONTENT_MODULE_ID,
});

const mockContentResult = (body: TPortableTextBody = []) =>
  okResult({ brandVariant: BRAND_VARIANT.PRIMARY, body, layout: undefined });

describe(`<${ContentModule.name}/>`, () => {
  beforeEach(() => {
    getContentMock.mockReset();
    getContentMock.mockResolvedValue(mockContentResult());
  });

  it('fetches the module with the resolved tenant Sanity context', async () => {
    await setup();

    expect(getContentMock).toHaveBeenCalledWith(
      MOCK_CONTENT_MODULE_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getContentMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders a body image resolving through the Sanity CDN', async () => {
    const body: TPortableTextBody = [
      {
        _type: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE,
        _key: faker.string.uuid(),
        layout: undefined,
        image: mockSanityImage({ alt: MOCK_IMAGE_ALT }),
      },
    ];
    getContentMock.mockResolvedValue(mockContentResult(body));

    await setup();

    const image = screen.getByRole('img', { name: MOCK_IMAGE_ALT });
    const source = image.getAttribute('src');

    expect(source).toContain(SANITY_CDN_HOST);
  });
});
