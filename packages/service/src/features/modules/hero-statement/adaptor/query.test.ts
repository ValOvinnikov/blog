import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_HERO_MODULE_ID } from '@blog/service/testing/pages/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_IMAGE_ASSET_DOCUMENT,
  mockLocalizedHeadingBlock,
  mockLocalizedImage,
  mockLocalizedStrings,
  mockLocalizedValues,
} from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { heroStatementModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

faker.seed(7);

const MOCK_EN_COPY = {
  eyebrow: faker.lorem.word(),
  heading: faker.lorem.words(3),
  supportingText: faker.lorem.sentence(),
  alt: faker.lorem.words(2),
};

const MOCK_NL_COPY = {
  eyebrow: faker.lorem.word(),
  heading: faker.lorem.words(3),
  supportingText: faker.lorem.sentence(),
  alt: faker.lorem.words(2),
};

const MOCK_HERO_DOCUMENT = {
  _id: MOCK_HERO_MODULE_ID,
  _type: 'module_heroStatement',
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  headingBlock: mockLocalizedHeadingBlock(
    {
      [EN]: MOCK_EN_COPY.heading,
      [NL]: MOCK_NL_COPY.heading,
    },
    {
      supportingText: mockLocalizedValues('internationalizedArrayTextValue', {
        [EN]: MOCK_EN_COPY.supportingText,
        [NL]: MOCK_NL_COPY.supportingText,
      }),
    },
  ),
  eyebrow: mockLocalizedStrings({
    [EN]: MOCK_EN_COPY.eyebrow,
    [NL]: MOCK_NL_COPY.eyebrow,
  }),
  image: mockLocalizedImage({ [EN]: MOCK_EN_COPY.alt, [NL]: MOCK_NL_COPY.alt }),
};

async function runHero(document: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    heroStatementModuleQuery.query,
    [document, MOCK_IMAGE_ASSET_DOCUMENT],
    undefined,
    { id: MOCK_HERO_MODULE_ID, locale, defaultLocale: EN },
  );

  return heroStatementModuleQuery.parse(raw);
}

describe('heroStatementModuleQuery', () => {
  it.each([
    ['picks the copy in the visitor language', NL, MOCK_NL_COPY],
    [
      'falls back to the default language when the visitor language is missing',
      FR,
      MOCK_EN_COPY,
    ],
  ])('%s', async (_, locale, copy) => {
    const { eyebrow, headingBlock, image } = await runHero(
      MOCK_HERO_DOCUMENT,
      locale,
    );

    expect(eyebrow).toBe(copy.eyebrow);
    expect(headingBlock).toEqual({
      heading: copy.heading,
      supportingText: copy.supportingText,
    });
    expect(image?.alt).toBe(copy.alt);
  });

  it('leaves the eyebrow and supporting text null when no language has a value', async () => {
    const { eyebrow, headingBlock } = await runHero(
      {
        ...MOCK_HERO_DOCUMENT,
        eyebrow: undefined,
        headingBlock: mockLocalizedHeadingBlock({ [EN]: MOCK_EN_COPY.heading }),
      },
      NL,
    );

    expect(eyebrow).toBeNull();
    expect(headingBlock.supportingText).toBeNull();
  });

  it('fails when the heading is missing in every language', async () => {
    await expect(
      runHero(
        {
          ...MOCK_HERO_DOCUMENT,
          headingBlock: { _type: 'moduleHeadingBlock' },
        },
        NL,
      ),
    ).rejects.toThrow();
  });
});
