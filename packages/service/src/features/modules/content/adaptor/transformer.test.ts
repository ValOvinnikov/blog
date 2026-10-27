import {
  BRAND_VARIANT,
  IMAGE_LAYOUT,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@blog/config';
import { mockRawContentModule } from '@blog/service/testing/modules/fixtures';
import {
  MOCK_BODY_IMAGE_KEY,
  mockRawBodyImageBlock,
  mockRawWideLayout,
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';

import { toContentModule } from './transformer';

describe(toContentModule, () => {
  it('maps the brand variant', () => {
    const raw = mockRawContentModule({ brandVariant: BRAND_VARIANT.SECONDARY });

    const module = toContentModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('maps a fully authored layout', () => {
    const layout = mockRawWideLayout();
    const raw = mockRawContentModule({ layout });

    const module = toContentModule(raw);

    expect(module.layout).toEqual(layout);
  });

  it('resolves a body image block into an image, keeping its layout', () => {
    const raw = mockRawContentModule({
      body: [mockRawBodyImageBlock({ layout: IMAGE_LAYOUT.INLINE })],
    });

    const module = toContentModule(raw);

    expect(module.body).toEqual([
      {
        _type: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE,
        _key: MOCK_BODY_IMAGE_KEY,
        layout: IMAGE_LAYOUT.INLINE,
        image: mockSanityImageView(),
      },
    ]);
  });
});
