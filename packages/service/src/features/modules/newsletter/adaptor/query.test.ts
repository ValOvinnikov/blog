import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { localizedValues } from '@blog/service/testing/shared/localized';

import { newsletterModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const newsletterDocument = {
  _id: 'newsletter-1',
  _type: 'module_newsletter',
  brandVariant: 'PRIMARY',
  headingBlock: {
    _type: 'moduleHeadingBlock',
    heading: localizedValues('internationalizedArrayStringValue', {
      [EN]: 'Stay in the loop',
      [NL]: 'Blijf op de hoogte',
    }),
    supportingText: localizedValues('internationalizedArrayTextValue', {
      [EN]: 'New posts weekly.',
      [NL]: 'Wekelijks nieuwe berichten.',
    }),
  },
  trustCues: [
    {
      _key: 'cue-1',
      _type: 'newsletterTrustCue',
      text: localizedValues('internationalizedArrayStringValue', {
        [EN]: 'No spam',
        [NL]: 'Geen spam',
      }),
    },
    {
      _key: 'cue-2',
      _type: 'newsletterTrustCue',
      text: localizedValues('internationalizedArrayStringValue', {
        [EN]: 'Unsubscribe anytime',
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
    { id: 'newsletter-1', locale, defaultLocale: EN },
  );

  return newsletterModuleQuery.parse(raw);
}

describe('newsletterModuleQuery', () => {
  it('filters to module_newsletter documents by id', () => {
    expect(newsletterModuleQuery.query).toContain(
      '_type == "module_newsletter"',
    );
    expect(newsletterModuleQuery.query).toContain('_id == $id');
  });

  it('coalesces variant to FULL for documents authored before the field existed', () => {
    expect(newsletterModuleQuery.query).toContain('coalesce(variant, "FULL")');
  });

  it('parses an authored COMPACT variant', () => {
    const raw = {
      brandVariant: 'PRIMARY',
      headingBlock: makeRawHeadingBlock('Stay in the loop'),
      variant: 'COMPACT',
      trustCues: null,
      layout: null,
      contentAlignment: null,
    };

    expect(newsletterModuleQuery.parse(raw).variant).toBe('COMPACT');
  });

  it('picks the heading and supporting text in the visitor language', async () => {
    const newsletter = await runNewsletter(newsletterDocument, NL);

    expect(newsletter.headingBlock).toEqual({
      heading: 'Blijf op de hoogte',
      supportingText: 'Wekelijks nieuwe berichten.',
    });
  });

  it('falls back to the default language for the heading and supporting text', async () => {
    const newsletter = await runNewsletter(newsletterDocument, FR);

    expect(newsletter.headingBlock).toEqual({
      heading: 'Stay in the loop',
      supportingText: 'New posts weekly.',
    });
  });

  it('picks each trust cue in the visitor language, falling back to the default', async () => {
    const newsletter = await runNewsletter(newsletterDocument, NL);

    expect(newsletter.trustCues).toEqual([
      { text: 'Geen spam' },
      { text: 'Unsubscribe anytime' },
    ]);
  });

  it('returns no trust cues when the module has none', async () => {
    const newsletter = await runNewsletter(
      { ...newsletterDocument, trustCues: undefined },
      NL,
    );

    expect(newsletter.trustCues).toBeNull();
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
