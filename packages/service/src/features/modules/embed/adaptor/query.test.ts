import { BRAND_VARIANT, LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_EMBED_MODULE_ID,
  MOCK_VIMEO_URL,
  mockRawEmbedModule,
} from '@blog/service/testing/modules/embed/fixtures';
import { evaluateModuleQuery } from '@blog/service/testing/shared/groq';
import {
  mockLocalizedHeadingBlock,
  mockLocalizedStrings,
} from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { embedModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

faker.seed(3772);

const MOCK_HEADING = { [EN]: faker.lorem.words(3), [NL]: faker.lorem.words(3) };
const MOCK_TITLE = { [EN]: faker.lorem.words(3), [NL]: faker.lorem.words(3) };
const MOCK_CAPTION = {
  [EN]: faker.lorem.sentence(),
  [NL]: faker.lorem.sentence(),
};

const MOCK_EMBED_DOCUMENT = {
  _id: MOCK_EMBED_MODULE_ID,
  _type: 'module_embed',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock(MOCK_HEADING),
  embed: {
    _type: 'embed',
    url: MOCK_VIMEO_URL,
    title: mockLocalizedStrings(MOCK_TITLE),
    caption: mockLocalizedStrings(MOCK_CAPTION),
  },
};

function runEmbed(document: Record<string, unknown>, locale: string) {
  return evaluateModuleQuery(embedModuleQuery, [document], {
    id: MOCK_EMBED_MODULE_ID,
    locale,
  });
}

describe('embedModuleQuery', () => {
  it.each([
    ['a module with no embed', { embed: null }],
    [
      'an embed with no url',
      { embed: { ...mockRawEmbedModule().embed, url: null } },
    ],
    [
      'an embed with no title',
      { embed: { ...mockRawEmbedModule().embed, title: null } },
    ],
  ])('rejects %s', (_case, overrides) => {
    const raw = { ...mockRawEmbedModule(), ...overrides };

    expect(() => embedModuleQuery.parse(raw)).toThrow();
  });

  it.each([
    ['picks the copy in the visitor language', NL, NL],
    ['falls back to the default language', FR, EN],
  ])('%s', async (_case, locale, copyLocale) => {
    const module = await runEmbed(MOCK_EMBED_DOCUMENT, locale);

    expect(module).toEqual({
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: { heading: MOCK_HEADING[copyLocale], supportingText: null },
      embed: {
        url: MOCK_VIMEO_URL,
        title: MOCK_TITLE[copyLocale],
        caption: MOCK_CAPTION[copyLocale],
      },
      ctaButtons: null,
      contentAlignment: null,
      layout: null,
    });
  });

  it('leaves the caption null when no language has one', async () => {
    const module = await runEmbed(
      {
        ...MOCK_EMBED_DOCUMENT,
        embed: { ...MOCK_EMBED_DOCUMENT.embed, caption: undefined },
      },
      NL,
    );

    expect(module.embed.caption).toBeNull();
  });
});
