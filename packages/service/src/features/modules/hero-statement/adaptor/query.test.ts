import { HERO_VARIANT } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  localizedStrings,
  localizedValues,
} from '@blog/service/testing/shared/localized';

import { heroStatementModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const heroDocument = {
  _id: 'hero-1',
  _type: 'module_heroStatement',
  brandVariant: 'PRIMARY',
  variant: HERO_VARIANT.SPLIT,
  headingBlock: {
    _type: 'moduleHeadingBlock',
    heading: localizedStrings({ [EN]: 'Build calmly', [NL]: 'Bouw rustig' }),
    supportingText: localizedValues('internationalizedArrayTextValue', {
      [EN]: 'Notes on making things.',
      [NL]: 'Notities over maken.',
    }),
  },
  eyebrow: localizedStrings({ [EN]: 'Welcome', [NL]: 'Welkom' }),
  image: {
    _type: 'localizedImageWithAlt',
    asset: { _type: 'reference', _ref: 'image-1' },
    alt: localizedStrings({ [EN]: 'A desk', [NL]: 'Een bureau' }),
  },
};

const imageAsset = { _id: 'image-1', _type: 'sanity.imageAsset' };

async function runHero(document: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    heroStatementModuleQuery.query,
    [document, imageAsset],
    undefined,
    { id: 'hero-1', locale, defaultLocale: EN },
  );

  return heroStatementModuleQuery.parse(raw);
}

describe('heroStatementModuleQuery', () => {
  it('picks heading, supporting text, eyebrow and image alt in the visitor language', async () => {
    const hero = await runHero(heroDocument, NL);

    expect(hero).toMatchObject({
      eyebrow: 'Welkom',
      headingBlock: {
        heading: 'Bouw rustig',
        supportingText: 'Notities over maken.',
      },
      image: { alt: 'Een bureau' },
    });
  });

  it('falls back to the default language when the visitor language is missing', async () => {
    const hero = await runHero(heroDocument, FR);

    expect(hero).toMatchObject({
      eyebrow: 'Welcome',
      headingBlock: {
        heading: 'Build calmly',
        supportingText: 'Notes on making things.',
      },
      image: { alt: 'A desk' },
    });
  });

  it('leaves the eyebrow and supporting text null when no language has a value', async () => {
    const hero = await runHero(
      {
        ...heroDocument,
        eyebrow: undefined,
        headingBlock: {
          _type: 'moduleHeadingBlock',
          heading: localizedStrings({ [EN]: 'Build calmly' }),
        },
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
