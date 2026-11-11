import { BRAND_VARIANT } from '@blog/config';
import type { TRawEmbedModule } from '@blog/service/features/modules/embed/adaptor/transformer';
import { createMockFaker } from '@blog/service/testing/mock-faker';
import { mockRawHeadingBlock } from '@blog/service/testing/shared/fixtures';

const mockFaker = createMockFaker(3772);

export const MOCK_EMBED_MODULE_ID = mockFaker.string.uuid();
export const MOCK_VIMEO_ID = mockFaker.string.numeric(9);
export const MOCK_VIMEO_URL = `https://vimeo.com/${MOCK_VIMEO_ID}`;
export const MOCK_EMBED_TITLE = mockFaker.lorem.words(3);
export const MOCK_UNPARSABLE_EMBED_URL = 'not a url';

export function mockRawEmbed(
  overrides: Partial<TRawEmbedModule['embed']> = {},
): TRawEmbedModule['embed'] {
  return {
    url: MOCK_VIMEO_URL,
    title: MOCK_EMBED_TITLE,
    caption: null,
    ...overrides,
  };
}

export function mockRawEmbedModule(
  overrides: Partial<TRawEmbedModule> = {},
): TRawEmbedModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock(mockFaker.lorem.words(3)),
    embed: mockRawEmbed(),
    ctaButtons: null,
    contentAlignment: null,
    layout: null,
    ...overrides,
  };
}
