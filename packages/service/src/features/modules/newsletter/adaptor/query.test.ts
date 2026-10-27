import {
  BRAND_VARIANT,
  LOCALE_ISO_CODES,
  NEWSLETTER_VARIANT,
} from '@blog/config/constants';
import {
  MOCK_NEWSLETTER_MODULE_ID,
  mockRawNewsletterModule,
} from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  mockLocalizedHeadingBlock,
  mockLocalizedStrings,
  mockLocalizedValues,
} from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { newsletterModuleQuery } from './query';

faker.seed(11);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const TEXT_VALUE_TYPE = 'internationalizedArrayTextValue';
const TRUST_CUE_TYPE = 'newsletterTrustCue';
const MOCK_ENGLISH_HEADING = faker.lorem.words(3);
const MOCK_DUTCH_HEADING = faker.lorem.words(3);
const MOCK_ENGLISH_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_DUTCH_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_ENGLISH_CONTENT = faker.lorem.sentence();
const MOCK_DUTCH_CONTENT = faker.lorem.sentence();
const MOCK_ENGLISH_TRUST_CUE = faker.lorem.words(2);
const MOCK_DUTCH_TRUST_CUE = faker.lorem.words(2);
const MOCK_UNTRANSLATED_TRUST_CUE = faker.lorem.words(2);

const MOCK_NEWSLETTER_DOCUMENT = {
  _id: MOCK_NEWSLETTER_MODULE_ID,
  _type: 'module_newsletter',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock(
    {
      [EN]: MOCK_ENGLISH_HEADING,
      [NL]: MOCK_DUTCH_HEADING,
    },
    {
      supportingText: mockLocalizedValues(TEXT_VALUE_TYPE, {
        [EN]: MOCK_ENGLISH_SUPPORTING_TEXT,
        [NL]: MOCK_DUTCH_SUPPORTING_TEXT,
      }),
    },
  ),
  content: mockLocalizedValues(TEXT_VALUE_TYPE, {
    [EN]: MOCK_ENGLISH_CONTENT,
    [NL]: MOCK_DUTCH_CONTENT,
  }),
  trustCues: [
    {
      _key: faker.string.uuid(),
      _type: TRUST_CUE_TYPE,
      text: mockLocalizedStrings({
        [EN]: MOCK_ENGLISH_TRUST_CUE,
        [NL]: MOCK_DUTCH_TRUST_CUE,
      }),
    },
    {
      _key: faker.string.uuid(),
      _type: TRUST_CUE_TYPE,
      text: mockLocalizedStrings({
        [EN]: MOCK_UNTRANSLATED_TRUST_CUE,
      }),
    },
  ],
};

async function runNewsletter(
  document: Record<string, unknown>,
  locale: string,
) {
  const raw = await evaluateGroqExpression(
    newsletterModuleQuery.query,
    [document],
    undefined,
    { id: MOCK_NEWSLETTER_MODULE_ID, locale, defaultLocale: EN },
  );

  return newsletterModuleQuery.parse(raw);
}

type TNewsletter = Awaited<ReturnType<typeof runNewsletter>>;

describe('newsletterModuleQuery', () => {
  it('defaults variant to FULL for a document authored without it', async () => {
    const { variant } = await runNewsletter(MOCK_NEWSLETTER_DOCUMENT, EN);

    expect(variant).toBe(NEWSLETTER_VARIANT.FULL);
  });

  it('parses an authored COMPACT variant', () => {
    const raw = {
      ...mockRawNewsletterModule(),
      variant: NEWSLETTER_VARIANT.COMPACT,
    };

    expect(newsletterModuleQuery.parse(raw).variant).toBe(
      NEWSLETTER_VARIANT.COMPACT,
    );
  });

  describe('in Dutch', () => {
    let newsletter: TNewsletter;

    beforeEach(async () => {
      newsletter = await runNewsletter(MOCK_NEWSLETTER_DOCUMENT, NL);
    });

    it('picks the heading and supporting text in the visitor language', () => {
      expect(newsletter.headingBlock).toEqual({
        heading: MOCK_DUTCH_HEADING,
        supportingText: MOCK_DUTCH_SUPPORTING_TEXT,
      });
    });

    it('picks the content in the visitor language', () => {
      expect(newsletter.content).toBe(MOCK_DUTCH_CONTENT);
    });

    it('picks each trust cue in the visitor language, else the default', () => {
      expect(newsletter.trustCues).toEqual([
        { text: MOCK_DUTCH_TRUST_CUE },
        { text: MOCK_UNTRANSLATED_TRUST_CUE },
      ]);
    });
  });

  describe('in French', () => {
    let newsletter: TNewsletter;

    beforeEach(async () => {
      newsletter = await runNewsletter(MOCK_NEWSLETTER_DOCUMENT, FR);
    });

    it('falls back to the default language for heading and supporting text', () => {
      expect(newsletter.headingBlock).toEqual({
        heading: MOCK_ENGLISH_HEADING,
        supportingText: MOCK_ENGLISH_SUPPORTING_TEXT,
      });
    });

    it('falls back to the default language for the content', () => {
      expect(newsletter.content).toBe(MOCK_ENGLISH_CONTENT);
    });
  });

  it.each([
    ['content', { content: undefined }, (n: TNewsletter) => n.content],
    ['trustCues', { trustCues: undefined }, (n: TNewsletter) => n.trustCues],
  ])('maps a missing %s to null', async (_, missing, read) => {
    const newsletter = await runNewsletter(
      { ...MOCK_NEWSLETTER_DOCUMENT, ...missing },
      NL,
    );

    expect(read(newsletter)).toBeNull();
  });

  it('fails when the heading is missing in both languages', async () => {
    await expect(
      runNewsletter(
        {
          ...MOCK_NEWSLETTER_DOCUMENT,
          headingBlock: { _type: 'moduleHeadingBlock' },
        },
        NL,
      ),
    ).rejects.toThrow();
  });
});
