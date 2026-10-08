import { HERO_VARIANT } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { localizedStrings } from '@blog/service/testing/shared/localized';

import { heroProfileModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const person = { _id: 'person-1', _type: 'person', name: 'Jane Doe' };

const heroDocument = {
  _id: 'hero-1',
  _type: 'module_heroProfile',
  brandVariant: 'PRIMARY',
  variant: HERO_VARIANT.SPLIT,
  headingBlock: {
    _type: 'moduleHeadingBlock',
    heading: localizedStrings({ [EN]: 'Meet Jane', [NL]: 'Maak kennis' }),
  },
  eyebrow: localizedStrings({ [EN]: 'Founder', [NL]: 'Oprichter' }),
  author: { _type: 'reference', _ref: 'person-1' },
};

async function runHero(document: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    heroProfileModuleQuery.query,
    [document, person],
    undefined,
    { id: 'hero-1', locale, defaultLocale: EN },
  );

  return heroProfileModuleQuery.parse(raw);
}

describe('heroProfileModuleQuery', () => {
  it('picks the eyebrow in the visitor language', async () => {
    const hero = await runHero(heroDocument, NL);

    expect(hero.eyebrow).toBe('Oprichter');
  });

  it('falls back to the default-language eyebrow when the visitor language is missing', async () => {
    const hero = await runHero(heroDocument, FR);

    expect(hero.eyebrow).toBe('Founder');
  });

  it('leaves the eyebrow null when no language has a value', async () => {
    const hero = await runHero({ ...heroDocument, eyebrow: undefined }, NL);

    expect(hero.eyebrow).toBeNull();
  });

  it('defaults the display toggles to true for documents authored before they existed', async () => {
    const hero = await runHero(heroDocument, EN);

    expect(hero).toMatchObject({
      showSocialLinks: true,
      showRole: true,
      showBio: true,
    });
  });

  it('loads the hero without an image when Studio left an image with no asset', async () => {
    const hero = await runHero(
      {
        ...heroDocument,
        image: { _type: 'localizedImageWithAlt', alt: [{ language: EN }] },
      },
      EN,
    );

    expect(hero).toMatchObject({
      image: { asset: null, alt: null },
      eyebrow: 'Founder',
    });
  });

  it('resolves the author reference', async () => {
    const hero = await runHero(heroDocument, EN);

    expect(hero.author).toMatchObject({ _id: 'person-1', name: 'Jane Doe' });
  });
});
