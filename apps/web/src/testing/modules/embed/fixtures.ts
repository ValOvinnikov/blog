import {
  BRAND_VARIANT,
  EMBED_ORIGIN,
  EMBED_PROVIDER,
  MEDIA_RATIO,
} from '@blog/config';
import type { TEmbed, TEmbedModule } from '@blog/service';
import { createMockFaker } from '@web/testing/mock-faker';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

const mockFaker = createMockFaker(3774);

export const MOCK_EMBED_MODULE_ID = mockFaker.string.uuid();

export const mockEmbed = (overrides: Partial<TEmbed> = {}): TEmbed => ({
  provider: EMBED_PROVIDER.YOUTUBE,
  embedUrl: `${EMBED_ORIGIN.YOUTUBE}/embed/${mockFaker.string.alphanumeric(11)}`,
  ratio: MEDIA_RATIO.VIDEO,
  title: mockFaker.lorem.sentence(),
  caption: undefined,
  ...overrides,
});

export const MOCK_CAL_EMBED = mockEmbed({
  provider: EMBED_PROVIDER.CAL,
  embedUrl: `${EMBED_ORIGIN.CAL}/${mockFaker.internet.username()}/intro?embed=true`,
  ratio: MEDIA_RATIO.PORTRAIT,
});

export const mockEmbedModule = (
  overrides: Partial<TEmbedModule> = {},
): TEmbedModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: mockFaker.lorem.words(3) }),
  embed: mockEmbed(),
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
  ...overrides,
});
