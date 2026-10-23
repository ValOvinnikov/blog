import {
  BRAND_VARIANT,
  LOCALE_ISO_CODES,
  NEWSLETTER_VARIANT,
} from '@blog/config/constants';
import {
  MOCK_NEWSLETTER_HEADING,
  MOCK_NEWSLETTER_MODULE_ID,
  mockRawNewsletterModule,
} from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  mockLocalizedHeadingBlock,
  mockLocalizedStrings,
  mockLocalizedValues,
} from '@blog/service/testing/shared/localized';

import { newsletterModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const TEXT_VALUE_TYPE = 'internationalizedArrayTextValue';
const DUTCH_HEADING = 'Blijf op de hoogte';
const ENGLISH_SUPPORTING_TEXT = 'New posts weekly.';
const DUTCH_SUPPORTING_TEXT = 'Wekelijks nieuwe berichten.';
const ENGLISH_CONTENT = 'Practical notes on building for the web.';
const DUTCH_CONTENT = 'Praktische notities over bouwen voor het web.';
const TRUST_CUE_TYPE = 'newsletterTrustCue';
const UNTRANSLATED_TRUST_CUE = 'Unsubscribe anytime';

const newsletterDocument = {
  _id: MOCK_NEWSLETTER_MODULE_ID,
  _type: 'module_newsletter',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock(
    {
      [EN]: MOCK_NEWSLETTER_HEADING,
      [NL]: DUTCH_HEADING,
    },
    {
      supportingText: mockLocalizedValues(TEXT_VALUE_TYPE, {
        [EN]: ENGLISH_SUPPORTING_TEXT,
        [NL]: DUTCH_SUPPORTING_TEXT,
      }),
    },
  ),
  content: mockLocalizedValues(TEXT_VALUE_TYPE, {
    [EN]: ENGLISH_CONTENT,
    [NL]: DUTCH_CONTENT,
  }),
  trustCues: [
    {
      _key: 'cue-1',
      _type: TRUST_CUE_TYPE,
      text: mockLocalizedStrings({
        [EN]: 'No spam',
        [NL]: 'Geen spam',
      }),
    },
    {
      _key: 'cue-2',
      _type: TRUST_CUE_TYPE,
      text: mockLocalizedStrings({
        [EN]: UNTRANSLATED_TRUST_CUE,
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

describe('newsletterModuleQuery', () => {
  it('defaults variant to FULL for a document authored without it', async () => {
    const { variant } = await runNewsletter(newsletterDocument, EN);

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
    let newsletter: Awaited<ReturnType<typeof runNewsletter>>;

    beforeEach(async () => {
      newsletter = await runNewsletter(newsletterDocument, NL);
    });

    it('picks the heading and supporting text in the visitor language', () => {
      expect(newsletter.headingBlock).toEqual({
        heading: DUTCH_HEADING,
        supportingText: DUTCH_SUPPORTING_TEXT,
      });
    });

    it('picks the content in the visitor language', () => {
      expect(newsletter.content).toBe(DUTCH_CONTENT);
    });

    it('picks each trust cue in the visitor language, else the default', () => {
      expect(newsletter.trustCues).toEqual([
        { text: 'Geen spam' },
        { text: UNTRANSLATED_TRUST_CUE },
      ]);
    });
  });

  describe('in French', () => {
    let newsletter: Awaited<ReturnType<typeof runNewsletter>>;

    beforeEach(async () => {
      newsletter = await runNewsletter(newsletterDocument, FR);
    });

    it('falls back to the default language for the heading and supporting text', () => {
      expect(newsletter.headingBlock).toEqual({
        heading: MOCK_NEWSLETTER_HEADING,
        supportingText: ENGLISH_SUPPORTING_TEXT,
      });
    });

    it('falls back to the default language for the content', () => {
      expect(newsletter.content).toBe(ENGLISH_CONTENT);
    });
  });

  it.each([
    [{ content: undefined }, { content: null }],
    [{ trustCues: undefined }, { trustCues: null }],
  ])('maps a missing %o to %o', async (missing, expected) => {
    const newsletter = await runNewsletter(
      { ...newsletterDocument, ...missing },
      NL,
    );

    expect(newsletter).toMatchObject(expected);
  });

  it('fails when the heading is missing in both languages', async () => {
    await expect(
      runNewsletter(
        {
          ...newsletterDocument,
          headingBlock: { _type: 'moduleHeadingBlock' },
        },
        NL,
      ),
    ).rejects.toThrow();
  });
});
