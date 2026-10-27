import { BRAND_VARIANT, CTA_VARIANT } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRawCtaModule } from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_DUTCH_TEXT,
  MOCK_ENGLISH_TEXT,
  MOCK_IMAGE_ASSET_DOCUMENT,
  mockLocalizedHeadingBlock,
  mockLocalizedImage,
  mockLocalizedListedText,
  mockLocalizedStrings,
  mockLocalizedValues,
} from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { ctaModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

faker.seed(6014);

const MOCK_CTA_ID = faker.string.uuid();

const MOCK_EN_COPY = {
  eyebrow: faker.lorem.words(2),
  heading: faker.lorem.words(3),
  supportingText: faker.lorem.sentence(),
  footnote: faker.lorem.sentence(),
  alt: faker.lorem.words(2),
  content: MOCK_ENGLISH_TEXT,
};

const MOCK_NL_COPY = {
  eyebrow: faker.lorem.words(2),
  heading: faker.lorem.words(3),
  supportingText: faker.lorem.sentence(),
  footnote: faker.lorem.sentence(),
  alt: faker.lorem.words(2),
  content: MOCK_DUTCH_TEXT,
};

const MOCK_CTA_DOCUMENT = {
  _id: MOCK_CTA_ID,
  _type: 'module_cta',
  variant: CTA_VARIANT.SPLIT,
  brandVariant: BRAND_VARIANT.PRIMARY,
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
  footnote: mockLocalizedStrings({
    [EN]: MOCK_EN_COPY.footnote,
    [NL]: MOCK_NL_COPY.footnote,
  }),
  image: mockLocalizedImage({ [EN]: MOCK_EN_COPY.alt, [NL]: MOCK_NL_COPY.alt }),
  eyebrow: mockLocalizedStrings({
    [EN]: MOCK_EN_COPY.eyebrow,
    [NL]: MOCK_NL_COPY.eyebrow,
  }),
  content: mockLocalizedListedText({
    [EN]: MOCK_EN_COPY.content,
    [NL]: MOCK_NL_COPY.content,
  }),
};

async function runCta(document: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    ctaModuleQuery.query,
    [document, MOCK_IMAGE_ASSET_DOCUMENT],
    undefined,
    { id: MOCK_CTA_ID, locale, defaultLocale: EN },
  );

  return ctaModuleQuery.parse(raw);
}

describe('ctaModuleQuery', () => {
  it('parses a CTA document without a bandTone', () => {
    const raw = mockRawCtaModule({ bandTone: null });

    expect(() => ctaModuleQuery.parse(raw)).not.toThrow();
  });

  it.each([
    ['picks them in the visitor language', NL, MOCK_NL_COPY],
    ['falls back to the default language', FR, MOCK_EN_COPY],
  ])('localizes every copy field: %s', async (_, locale, copy) => {
    const cta = await runCta(MOCK_CTA_DOCUMENT, locale);

    expect(cta).toMatchObject({
      eyebrow: copy.eyebrow,
      headingBlock: {
        heading: copy.heading,
        supportingText: copy.supportingText,
      },
      footnote: copy.footnote,
      image: { alt: copy.alt },
      content: [{ children: [{ text: copy.content }] }],
    });
  });

  it('leaves optional localized fields null when no language has a value', async () => {
    const cta = await runCta(
      {
        ...MOCK_CTA_DOCUMENT,
        eyebrow: undefined,
        content: undefined,
        footnote: undefined,
        headingBlock: mockLocalizedHeadingBlock({ [EN]: MOCK_EN_COPY.heading }),
      },
      NL,
    );

    expect(cta).toMatchObject({
      eyebrow: null,
      content: null,
      footnote: null,
      headingBlock: { supportingText: null },
    });
  });

  it('loads the image with a null alt when it has no alt in either language', async () => {
    const cta = await runCta(
      {
        ...MOCK_CTA_DOCUMENT,
        image: { ...MOCK_CTA_DOCUMENT.image, alt: undefined },
      },
      NL,
    );

    expect(cta).toMatchObject({ image: { alt: null } });
  });

  it('fails when the heading is missing in both languages', async () => {
    await expect(
      runCta(
        {
          ...MOCK_CTA_DOCUMENT,
          headingBlock: { _type: 'moduleHeadingBlock' },
        },
        NL,
      ),
    ).rejects.toThrow();
  });
});
