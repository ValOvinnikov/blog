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

import { heroStatementModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const EN_COPY = {
  eyebrow: 'Welcome',
  heading: 'Build calmly',
  supportingText: 'Notes on making things.',
  alt: 'A desk',
};

const NL_COPY = {
  eyebrow: 'Welkom',
  heading: 'Bouw rustig',
  supportingText: 'Notities over maken.',
  alt: 'Een bureau',
};

const heroDocument = {
  _id: MOCK_HERO_MODULE_ID,
  _type: 'module_heroStatement',
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  headingBlock: mockLocalizedHeadingBlock(
    {
      [EN]: EN_COPY.heading,
      [NL]: NL_COPY.heading,
    },
    {
      supportingText: mockLocalizedValues('internationalizedArrayTextValue', {
        [EN]: EN_COPY.supportingText,
        [NL]: NL_COPY.supportingText,
      }),
    },
  ),
  eyebrow: mockLocalizedStrings({
    [EN]: EN_COPY.eyebrow,
    [NL]: NL_COPY.eyebrow,
  }),
  image: mockLocalizedImage({ [EN]: EN_COPY.alt, [NL]: NL_COPY.alt }),
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
    ['picks the copy in the visitor language', NL, NL_COPY],
    [
      'falls back to the default language when the visitor language is missing',
      FR,
      EN_COPY,
    ],
  ])('%s', async (_, locale, copy) => {
    const hero = await runHero(heroDocument, locale);

    expect(hero).toMatchObject({
      eyebrow: copy.eyebrow,
      headingBlock: {
        heading: copy.heading,
        supportingText: copy.supportingText,
      },
      image: { alt: copy.alt },
    });
  });

  it('leaves the eyebrow and supporting text null when no language has a value', async () => {
    const hero = await runHero(
      {
        ...heroDocument,
        eyebrow: undefined,
        headingBlock: mockLocalizedHeadingBlock({ [EN]: EN_COPY.heading }),
      },
      NL,
    );

    expect(hero).toMatchObject({
      eyebrow: null,
      headingBlock: { supportingText: null },
    });
  });

  it('fails when the heading is missing in every language', async () => {
    await expect(
      runHero(
        { ...heroDocument, headingBlock: { _type: 'moduleHeadingBlock' } },
        NL,
      ),
    ).rejects.toThrow();
  });
});
