import { CONTENT_ALIGNMENT, EMBED_PROVIDER, MEDIA_RATIO } from '@blog/config';
import {
  MOCK_EMBED_TITLE,
  MOCK_UNPARSABLE_EMBED_URL,
  MOCK_VIMEO_ID,
  mockRawEmbed,
  mockRawEmbedModule,
} from '@blog/service/testing/modules/embed/fixtures';
import {
  mockCtaButtonView,
  mockRawCtaButton,
} from '@blog/service/testing/modules/fixtures';
import { faker } from '@faker-js/faker';

import { toEmbedModule } from './transformer';

faker.seed(3772);

const MOCK_CAPTION = faker.lorem.sentence();
const MOCK_YOUTUBE_ID = faker.string.alphanumeric(11);

describe(toEmbedModule, () => {
  it('maps a supported link to its privacy-friendly embed URL and ratio', () => {
    const raw = mockRawEmbedModule();

    const module = toEmbedModule(raw);

    expect(module.embed).toEqual({
      provider: EMBED_PROVIDER.VIMEO,
      embedUrl: `https://player.vimeo.com/video/${MOCK_VIMEO_ID}`,
      ratio: MEDIA_RATIO.VIDEO,
      title: MOCK_EMBED_TITLE,
      caption: undefined,
    });
  });

  it('serves a YouTube Short from the nocookie host in the vertical ratio', () => {
    const raw = mockRawEmbedModule({
      embed: mockRawEmbed({
        url: `https://www.youtube.com/shorts/${MOCK_YOUTUBE_ID}`,
      }),
    });

    const module = toEmbedModule(raw);

    expect(module.embed).toMatchObject({
      provider: EMBED_PROVIDER.YOUTUBE,
      embedUrl: `https://www.youtube-nocookie.com/embed/${MOCK_YOUTUBE_ID}`,
      ratio: MEDIA_RATIO.VERTICAL,
    });
  });

  it('keeps an authored caption', () => {
    const raw = mockRawEmbedModule({
      embed: mockRawEmbed({ caption: MOCK_CAPTION }),
    });

    const module = toEmbedModule(raw);

    expect(module.embed?.caption).toBe(MOCK_CAPTION);
  });

  it.each([
    ['an unsupported host', 'https://example.com/watch/1'],
    ['a value that is no longer a URL', MOCK_UNPARSABLE_EMBED_URL],
  ])('drops the embed when the stored link is %s', (_case, url) => {
    const raw = mockRawEmbedModule({ embed: mockRawEmbed({ url }) });

    const module = toEmbedModule(raw);

    expect(module.embed).toBeUndefined();
  });

  it('leaves alignment and layout undefined and buttons empty when unset', () => {
    const raw = mockRawEmbedModule({
      ctaButtons: null,
      contentAlignment: null,
      layout: null,
    });

    const module = toEmbedModule(raw);

    expect(module).toMatchObject({
      contentAlignment: undefined,
      layout: undefined,
      ctaButtons: [],
    });
  });

  it('maps authored buttons and alignment', () => {
    const raw = mockRawEmbedModule({
      ctaButtons: [mockRawCtaButton()],
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
    });

    const module = toEmbedModule(raw);

    expect(module.ctaButtons).toEqual([mockCtaButtonView()]);
    expect(module.contentAlignment).toBe(CONTENT_ALIGNMENT.CENTER);
  });
});
