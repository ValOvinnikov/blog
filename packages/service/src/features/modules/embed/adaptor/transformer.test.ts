import { CONTENT_ALIGNMENT, EMBED_PROVIDER, MEDIA_RATIO } from '@blog/config';
import {
  MOCK_EMBED_TITLE,
  MOCK_UNPARSABLE_EMBED_URL,
  MOCK_VIMEO_ID,
  mockRawEmbed,
  mockRawEmbedModule,
} from '@blog/service/testing/modules/embed/fixtures';
import { faker } from '@faker-js/faker';

import { toEmbedModule } from './transformer';

faker.seed(3772);

const MOCK_CAPTION = faker.lorem.sentence();

describe(toEmbedModule, () => {
  it('maps a supported link to its parsed embed with the authored copy', () => {
    const raw = mockRawEmbedModule({
      embed: mockRawEmbed({ caption: MOCK_CAPTION }),
    });

    const module = toEmbedModule(raw);

    expect(module.embed).toEqual({
      provider: EMBED_PROVIDER.VIMEO,
      embedUrl: `https://player.vimeo.com/video/${MOCK_VIMEO_ID}`,
      ratio: MEDIA_RATIO.VIDEO,
      title: MOCK_EMBED_TITLE,
      caption: MOCK_CAPTION,
    });
  });

  it('drops the embed when the stored link no longer parses', () => {
    const raw = mockRawEmbedModule({
      embed: mockRawEmbed({ url: MOCK_UNPARSABLE_EMBED_URL }),
    });

    const module = toEmbedModule(raw);

    expect(module.embed).toBeUndefined();
  });

  it.each([
    [null, undefined],
    [CONTENT_ALIGNMENT.CENTER, CONTENT_ALIGNMENT.CENTER],
  ])('maps contentAlignment %s to %s', (contentAlignment, expected) => {
    const raw = mockRawEmbedModule({ contentAlignment });

    const module = toEmbedModule(raw);

    expect(module.contentAlignment).toBe(expected);
  });
});
